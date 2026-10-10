import os
import json
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Tender, Document, Requirement, ComplianceResult,
    VerificationResult, RiskAssessment, AuditLog, BidderInfo, Report
)
from app.utils.auth import get_current_user
from app.services.ai_service import extraction_service
from app.services.verification_service import verification_service
from app.services.risk_service import calculate_risk_score
from app.rules.compliance_rules import (
    get_requirements_for_tender, DEMO_COMPLIANCE_RESULTS, calculate_compliance_score
)

router = APIRouter(prefix="/api/tenders", tags=["tenders"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def log_event(db, user_id, tender_id, event_type, description, status="success"):
    log = AuditLog(
        user_id=user_id,
        tender_id=tender_id,
        event_type=event_type,
        event_description=description,
        status=status,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()


# ── List all tenders ──────────────────────────────────────────────────────────

@router.get("")
def list_tenders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tenders = db.query(Tender).filter(Tender.owner_id == current_user.id).order_by(Tender.created_at.desc()).all()
    return [_tender_to_dict(t) for t in tenders]


# ── Get single tender ─────────────────────────────────────────────────────────

@router.get("/{tender_id}")
def get_tender(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    result = _tender_to_dict(tender)
    result["documents"] = [_doc_to_dict(d) for d in tender.documents]
    return result


# ── Upload tender PDF ─────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_tender(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50 MB limit.")

    # Save file
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text using pypdf (pure Python, no compilation required)
    extracted_text = ""
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        for page in reader.pages:
            extracted_text += (page.extract_text() or "")
    except Exception:
        extracted_text = ""

    # Run mock AI extraction
    extraction = extraction_service.extract(extracted_text, file.filename)
    tender_info = extraction["tender_info"]
    bidder_info = extraction["bidder_info"]

    # Create or get tender
    gem_id = tender_info.get("tender_id", f"GEM/2024/B/{uuid.uuid4().hex[:7].upper()}")
    existing = db.query(Tender).filter(
        Tender.gem_tender_id == gem_id,
        Tender.owner_id == current_user.id
    ).first()

    if existing:
        tender = existing
    else:
        tender = Tender(
            gem_tender_id=gem_id,
            title=tender_info.get("title", "Untitled Tender"),
            department=tender_info.get("department"),
            bid_value=tender_info.get("bid_value"),
            due_date=tender_info.get("due_date"),
            status="in_progress",
            analysis_status="pending",
            owner_id=current_user.id,
        )
        db.add(tender)
        db.commit()
        db.refresh(tender)

    # Save document record
    classification = extraction_service.classify_document(file.filename, extracted_text)
    doc_record = Document(
        tender_id=tender.id,
        filename=unique_name,
        original_name=file.filename,
        file_size=len(content),
        doc_type="tender_document",
        classification=classification,
        extracted_text=extracted_text[:5000] if extracted_text else None,
        upload_status="uploaded",
    )
    db.add(doc_record)
    db.commit()

    # Save/update bidder info
    existing_bidder = db.query(BidderInfo).filter(BidderInfo.tender_id == tender.id).first()
    if not existing_bidder:
        bi = BidderInfo(tender_id=tender.id, **bidder_info)
        db.add(bi)
        db.commit()

    # Audit log
    log_event(db, current_user.id, tender.id, "document_uploaded",
              f"Tender document uploaded: {file.filename}")

    return {
        "tender_id": tender.id,
        "gem_tender_id": tender.gem_tender_id,
        "title": tender.title,
        "document_id": doc_record.id,
        "filename": file.filename,
        "file_size": len(content),
        "status": "uploaded",
        "tender_info": tender_info,
        "message": "Document uploaded successfully. Proceed to analysis."
    }


# ── Analyze tender ────────────────────────────────────────────────────────────

@router.post("/{tender_id}/analyze")
def analyze_tender(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    tender.analysis_status = "processing"
    db.commit()

    log_event(db, current_user.id, tender.id, "analysis_started", "AI analysis started")

    # Generate requirements for this tender type
    req_list = get_requirements_for_tender(tender.title)
    db.query(Requirement).filter(Requirement.tender_id == tender.id).delete()
    requirements = []
    for req_data in req_list:
        r = Requirement(tender_id=tender.id, **req_data)
        db.add(r)
        requirements.append(r)
    db.commit()

    # Run compliance check
    db.query(ComplianceResult).filter(ComplianceResult.tender_id == tender.id).delete()
    compliance_results = []
    for r in db.query(Requirement).filter(Requirement.tender_id == tender.id).all():
        demo = DEMO_COMPLIANCE_RESULTS.get(r.name, {
            "document_found": None, "status": "missing",
            "remarks": "Document not found.", "confidence": 0.0
        })
        cr = ComplianceResult(
            tender_id=tender.id,
            requirement_id=r.id,
            document_found=demo.get("document_found"),
            status=demo.get("status", "missing"),
            remarks=demo.get("remarks", ""),
            confidence=demo.get("confidence", 0.0),
        )
        db.add(cr)
        compliance_results.append(cr)
    db.commit()

    # Calculate compliance score
    results_fresh = db.query(ComplianceResult).filter(ComplianceResult.tender_id == tender.id).all()
    applicable = [r for r in results_fresh if r.status != "not_applicable"]
    compliant_count = sum(1 for r in applicable if r.status == "compliant")
    score = round((compliant_count / len(applicable)) * 100, 1) if applicable else 0

    tender.compliance_score = score
    tender.analysis_status = "completed"
    db.commit()

    log_event(db, current_user.id, tender.id, "analysis_completed",
              f"AI analysis completed. Compliance score: {score}%")

    bidder = db.query(BidderInfo).filter(BidderInfo.tender_id == tender.id).first()
    return {
        "tender_id": tender.id,
        "status": "completed",
        "compliance_score": score,
        "bidder_info": _bidder_to_dict(bidder) if bidder else {},
        "message": "Analysis completed successfully."
    }


# ── Get compliance checklist ──────────────────────────────────────────────────

@router.get("/{tender_id}/compliance")
def get_compliance(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    results = (
        db.query(ComplianceResult, Requirement)
        .join(Requirement, ComplianceResult.requirement_id == Requirement.id)
        .filter(ComplianceResult.tender_id == tender_id)
        .all()
    )

    result_list = []
    for cr, req in results:
        result_list.append({
            "id": cr.id,
            "requirement_id": req.id,
            "requirement_name": req.name,
            "category": req.category,
            "is_mandatory": req.is_mandatory,
            "document_found": cr.document_found,
            "status": cr.status,
            "remarks": cr.remarks,
            "confidence": cr.confidence,
            "checked_at": cr.checked_at.isoformat(),
        })

    applicable = [r for r in result_list if r["status"] != "not_applicable"]
    compliant = [r for r in applicable if r["status"] == "compliant"]
    missing = [r for r in applicable if r["status"] == "missing"]
    attention = [r for r in applicable if r["status"] == "needs_attention"]
    na = [r for r in result_list if r["status"] == "not_applicable"]
    score = round((len(compliant) / len(applicable)) * 100, 1) if applicable else 0

    return {
        "tender_id": tender_id,
        "compliance_score": score,
        "total": len(result_list),
        "compliant": len(compliant),
        "missing": len(missing),
        "needs_attention": len(attention),
        "not_applicable": len(na),
        "results": result_list,
    }


# ── Government verification ───────────────────────────────────────────────────

@router.post("/{tender_id}/verify")
def run_verification(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    bidder = db.query(BidderInfo).filter(BidderInfo.tender_id == tender_id).first()

    gstin = bidder.gstin if bidder else "33ABCDE1234F1Z5"
    pan = bidder.pan if bidder else "ABCDE1234F"
    cin = bidder.cin if bidder else "U74999TN2018PTC123456"
    udyam = bidder.udyam_number if bidder else "UDYAM-TN-12-345678"

    log_event(db, current_user.id, tender.id, "verification_started",
              "Government portal verification started")

    verifications = verification_service.run_all_verifications(gstin, pan, cin, udyam)

    db.query(VerificationResult).filter(VerificationResult.tender_id == tender_id).delete()
    ver_records = []
    for v in verifications:
        vr = VerificationResult(
            tender_id=tender_id,
            verification_item=v["verification_item"],
            source_portal=v["source_portal"],
            status=v["status"],
            details=v["details"],
            raw_response=json.dumps(v.get("raw_response", {})),
        )
        db.add(vr)
        ver_records.append(vr)
    db.commit()

    log_event(db, current_user.id, tender.id, "verification_completed",
              "Government portal verification completed. All verifications passed.")

    return {
        "tender_id": tender_id,
        "status": "completed",
        "demo_mode": True,
        "note": "DEMO/MOCK verification – prototype simulation only",
        "verifications": verifications,
    }


# ── Get verification results ──────────────────────────────────────────────────

@router.get("/{tender_id}/verify")
def get_verification(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    results = db.query(VerificationResult).filter(VerificationResult.tender_id == tender_id).all()
    return [_ver_to_dict(v) for v in results]


# ── Risk assessment ───────────────────────────────────────────────────────────

@router.get("/{tender_id}/risk")
def get_risk(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)

    existing = db.query(RiskAssessment).filter(RiskAssessment.tender_id == tender_id).first()
    if existing:
        return _risk_to_dict(existing)

    compliance_results = db.query(ComplianceResult).filter(ComplianceResult.tender_id == tender_id).all()
    verification_results = db.query(VerificationResult).filter(VerificationResult.tender_id == tender_id).all()

    risk_data = calculate_risk_score(compliance_results, verification_results)

    ra = RiskAssessment(
        tender_id=tender_id,
        total_score=risk_data["total_score"],
        risk_level=risk_data["risk_level"],
        missing_docs_score=risk_data["missing_docs_score"],
        invalid_docs_score=risk_data["invalid_docs_score"],
        expired_certs_score=risk_data["expired_certs_score"],
        verification_failures_score=risk_data["verification_failures_score"],
        financial_inconsistency_score=risk_data["financial_inconsistency_score"],
        eligibility_mismatch_score=risk_data["eligibility_mismatch_score"],
        blacklist_score=risk_data["blacklist_score"],
        explanation=risk_data["explanation"],
    )
    db.add(ra)
    tender.risk_score = risk_data["total_score"]
    tender.risk_level = risk_data["risk_level"]
    db.commit()
    db.refresh(ra)

    log_event(db, current_user.id, tender.id, "risk_assessed",
              f"Risk assessment completed. Score: {risk_data['total_score']}/100 ({risk_data['risk_level']} risk)")

    return _risk_to_dict(ra)


# ── Upload missing document ───────────────────────────────────────────────────

@router.post("/{tender_id}/documents")
async def upload_missing_document(
    tender_id: int,
    requirement_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 50 MB limit.")

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    doc_record = Document(
        tender_id=tender_id,
        filename=unique_name,
        original_name=file.filename,
        file_size=len(content),
        doc_type="supporting_document",
        upload_status="uploaded",
    )
    db.add(doc_record)

    # Update compliance result
    cr = db.query(ComplianceResult).filter(
        ComplianceResult.tender_id == tender_id,
        ComplianceResult.requirement_id == requirement_id
    ).first()
    if cr:
        cr.document_found = file.filename
        cr.status = "compliant"
        cr.remarks = "Document uploaded by vendor. Marked as compliant."
        cr.confidence = 85.0

    # Recalculate score
    all_results = db.query(ComplianceResult).filter(ComplianceResult.tender_id == tender_id).all()
    applicable = [r for r in all_results if r.status != "not_applicable"]
    compliant_count = sum(1 for r in applicable if r.status == "compliant")
    new_score = round((compliant_count / len(applicable)) * 100, 1) if applicable else 0
    tender.compliance_score = new_score

    # Reset risk (force recalculation)
    db.query(RiskAssessment).filter(RiskAssessment.tender_id == tender_id).delete()
    tender.risk_score = None
    tender.risk_level = None

    db.commit()

    log_event(db, current_user.id, tender_id, "document_uploaded",
              f"Missing document uploaded: {file.filename}. New compliance score: {new_score}%")

    req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    return {
        "message": "Document uploaded successfully.",
        "requirement": req.name if req else "Unknown",
        "new_status": "compliant",
        "new_compliance_score": new_score,
    }


# ── Get bidder info ───────────────────────────────────────────────────────────

@router.get("/{tender_id}/bidder")
def get_bidder_info(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    bidder = db.query(BidderInfo).filter(BidderInfo.tender_id == tender_id).first()
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder info not found. Run analysis first.")
    return _bidder_to_dict(bidder)


# ── Audit trail for tender ────────────────────────────────────────────────────

@router.get("/{tender_id}/audit")
def get_tender_audit(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = _get_tender_or_404(db, tender_id, current_user.id)
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.tender_id == tender_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    return [_log_to_dict(l) for l in logs]


# ── Helper functions ──────────────────────────────────────────────────────────

def _get_tender_or_404(db, tender_id, user_id):
    tender = db.query(Tender).filter(Tender.id == tender_id, Tender.owner_id == user_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")
    return tender


def _tender_to_dict(t):
    return {
        "id": t.id,
        "gem_tender_id": t.gem_tender_id,
        "title": t.title,
        "department": t.department,
        "bid_value": t.bid_value,
        "due_date": t.due_date,
        "status": t.status,
        "compliance_score": t.compliance_score,
        "risk_score": t.risk_score,
        "risk_level": t.risk_level,
        "analysis_status": t.analysis_status,
        "created_at": t.created_at.isoformat(),
        "updated_at": t.updated_at.isoformat(),
    }


def _doc_to_dict(d):
    return {
        "id": d.id,
        "filename": d.original_name,
        "file_size": d.file_size,
        "doc_type": d.doc_type,
        "classification": d.classification,
        "upload_status": d.upload_status,
        "uploaded_at": d.uploaded_at.isoformat(),
    }


def _ver_to_dict(v):
    return {
        "id": v.id,
        "verification_item": v.verification_item,
        "source_portal": v.source_portal,
        "status": v.status,
        "details": v.details,
        "verified_at": v.verified_at.isoformat(),
    }


def _risk_to_dict(r):
    return {
        "id": r.id,
        "tender_id": r.tender_id,
        "total_score": r.total_score,
        "risk_level": r.risk_level,
        "missing_docs_score": r.missing_docs_score,
        "invalid_docs_score": r.invalid_docs_score,
        "expired_certs_score": r.expired_certs_score,
        "verification_failures_score": r.verification_failures_score,
        "financial_inconsistency_score": r.financial_inconsistency_score,
        "eligibility_mismatch_score": r.eligibility_mismatch_score,
        "blacklist_score": r.blacklist_score,
        "explanation": r.explanation,
        "assessed_at": r.assessed_at.isoformat(),
    }


def _bidder_to_dict(b):
    return {
        "company_name": b.company_name,
        "company_confidence": b.company_confidence,
        "gstin": b.gstin,
        "gstin_confidence": b.gstin_confidence,
        "pan": b.pan,
        "pan_confidence": b.pan_confidence,
        "cin": b.cin,
        "cin_confidence": b.cin_confidence,
        "udyam_number": b.udyam_number,
        "udyam_confidence": b.udyam_confidence,
        "turnover": b.turnover,
        "turnover_confidence": b.turnover_confidence,
        "experience": b.experience,
        "experience_confidence": b.experience_confidence,
        "bank_details": b.bank_details,
        "bank_confidence": b.bank_confidence,
        "digital_signature": b.digital_signature,
        "dsc_confidence": b.dsc_confidence,
    }


def _log_to_dict(l):
    return {
        "id": l.id,
        "tender_id": l.tender_id,
        "event_type": l.event_type,
        "event_description": l.event_description,
        "status": l.status,
        "created_at": l.created_at.isoformat(),
    }
