import os
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Tender, Report, ComplianceResult, VerificationResult, Requirement, AuditLog, BidderInfo, RiskAssessment
from app.utils.auth import get_current_user
from app.utils.pdf_generator import generate_compliance_report

router = APIRouter(prefix="/api/reports", tags=["reports"])

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


@router.get("")
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = (
        db.query(Report)
        .join(Tender, Report.tender_id == Tender.id)
        .filter(Tender.owner_id == current_user.id)
        .order_by(Report.generated_at.desc())
        .all()
    )
    result = []
    for r in reports:
        tender = db.query(Tender).filter(Tender.id == r.tender_id).first()
        result.append({
            "id": r.id,
            "report_id": r.report_id,
            "tender_id": r.tender_id,
            "gem_tender_id": tender.gem_tender_id if tender else "",
            "tender_title": tender.title if tender else "",
            "compliance_score": r.compliance_score,
            "risk_level": r.risk_level,
            "generated_at": r.generated_at.isoformat(),
        })
    return result


@router.post("/{tender_id}/generate")
def generate_report(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tender = db.query(Tender).filter(Tender.id == tender_id, Tender.owner_id == current_user.id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")

    # Gather data
    compliance_results = (
        db.query(ComplianceResult, Requirement)
        .join(Requirement, ComplianceResult.requirement_id == Requirement.id)
        .filter(ComplianceResult.tender_id == tender_id)
        .all()
    )
    verification_results = db.query(VerificationResult).filter(VerificationResult.tender_id == tender_id).all()
    risk = db.query(RiskAssessment).filter(RiskAssessment.tender_id == tender_id).first()
    bidder = db.query(BidderInfo).filter(BidderInfo.tender_id == tender_id).first()

    # Build result lists
    cr_list = []
    for cr, req in compliance_results:
        cr_list.append({
            "requirement_name": req.name,
            "document_found": cr.document_found,
            "status": cr.status,
            "remarks": cr.remarks,
        })

    applicable = [r for r in cr_list if r["status"] != "not_applicable"]
    compliant_count = sum(1 for r in applicable if r["status"] == "compliant")
    score = round((compliant_count / len(applicable)) * 100, 1) if applicable else 0

    vr_list = [{"verification_item": v.verification_item, "source_portal": v.source_portal,
                "status": v.status, "details": v.details} for v in verification_results]

    report_data = {
        "tender": {
            "gem_tender_id": tender.gem_tender_id,
            "title": tender.title,
            "department": tender.department,
            "bid_value": tender.bid_value,
            "due_date": tender.due_date,
            "status": tender.status,
        },
        "compliance_score": score,
        "risk_score": risk.total_score if risk else 0,
        "risk_level": risk.risk_level if risk else "low",
        "compliance_summary": {
            "compliant": sum(1 for r in cr_list if r["status"] == "compliant"),
            "missing": sum(1 for r in cr_list if r["status"] == "missing"),
            "needs_attention": sum(1 for r in cr_list if r["status"] == "needs_attention"),
            "not_applicable": sum(1 for r in cr_list if r["status"] == "not_applicable"),
        },
        "compliance_results": cr_list,
        "verification_results": vr_list,
    }

    # Generate PDF
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    pdf_filename = f"{report_id}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)

    try:
        generate_compliance_report(report_data, pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

    # Save report record
    report = Report(
        report_id=report_id,
        tender_id=tender_id,
        compliance_score=score,
        risk_level=risk.risk_level if risk else "low",
        file_path=pdf_path,
    )
    db.add(report)

    # Audit log
    log = AuditLog(
        user_id=current_user.id,
        tender_id=tender_id,
        event_type="report_generated",
        event_description=f"Compliance report generated: {report_id}",
        status="success",
    )
    db.add(log)
    db.commit()

    return {
        "report_id": report_id,
        "compliance_score": score,
        "risk_level": risk.risk_level if risk else "low",
        "message": "Report generated successfully.",
    }


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found.")
    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=f"ComplyAI_Report_{report_id}.pdf"
    )
