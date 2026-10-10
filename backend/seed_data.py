"""
Database seeder – populates demo data for SIH prototype.
Run: python seed_data.py (from backend/ directory)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine
from app.models import (
    Base, User, Tender, Document, Requirement, ComplianceResult,
    VerificationResult, RiskAssessment, Report, AuditLog, BidderInfo
)
from app.utils.auth import get_password_hash
from app.rules.compliance_rules import TENDER_REQUIREMENTS, DEMO_COMPLIANCE_RESULTS
from app.services.verification_service import verification_service

Base.metadata.create_all(bind=engine)

db = SessionLocal()


def seed():
    # Clear existing
    for model in [AuditLog, Report, RiskAssessment, VerificationResult, ComplianceResult, 
                  Requirement, BidderInfo, Document, Tender, User]:
        db.query(model).delete()
    db.commit()

    # ── Demo User ─────────────────────────────────────────────────────────────
    user = User(
        email="vendor@complyai.demo",
        hashed_password=get_password_hash("demo123"),
        full_name="Surya K",
        organization="ABC Technologies Pvt. Ltd.",
        role="vendor",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # ── Demo Tenders ──────────────────────────────────────────────────────────
    tenders_data = [
        {
            "gem_tender_id": "GEM/2024/B/5678901",
            "title": "Supply, Installation and Maintenance of Laptops",
            "department": "Ministry of Education",
            "bid_value": 12500000.0,
            "due_date": "30 Sep 2025",
            "status": "in_progress",
            "compliance_score": 78.0,
            "risk_score": 18.0,
            "risk_level": "low",
            "analysis_status": "completed",
        },
        {
            "gem_tender_id": "GEM/2024/B/5432109",
            "title": "Annual Supply of Office Stationery",
            "department": "Ministry of Home Affairs",
            "bid_value": 4850000.0,
            "due_date": "25 Sep 2025",
            "status": "submitted",
            "compliance_score": 91.0,
            "risk_score": 8.0,
            "risk_level": "low",
            "analysis_status": "completed",
        },
        {
            "gem_tender_id": "GEM/2024/B/4987654",
            "title": "IT Equipment for Govt. Schools",
            "department": "Ministry of Education",
            "bid_value": 27500000.0,
            "due_date": "20 Sep 2025",
            "status": "submitted",
            "compliance_score": 85.0,
            "risk_score": 12.0,
            "risk_level": "low",
            "analysis_status": "completed",
        },
        {
            "gem_tender_id": "GEM/2024/B/4455667",
            "title": "Cloud Infrastructure Services",
            "department": "MeitY",
            "bid_value": 52000000.0,
            "due_date": "15 Sep 2025",
            "status": "won",
            "compliance_score": 96.0,
            "risk_score": 4.0,
            "risk_level": "low",
            "analysis_status": "completed",
        },
        {
            "gem_tender_id": "GEM/2024/B/3344556",
            "title": "Security & Surveillance Systems",
            "department": "Ministry of Home Affairs",
            "bid_value": 31000000.0,
            "due_date": "10 Sep 2025",
            "status": "not_qualified",
            "compliance_score": 42.0,
            "risk_score": 65.0,
            "risk_level": "high",
            "analysis_status": "completed",
        },
        {
            "gem_tender_id": "GEM/2024/B/2233445",
            "title": "Smart Classroom Solutions",
            "department": "Ministry of Education",
            "bid_value": 18000000.0,
            "due_date": "05 Oct 2025",
            "status": "in_progress",
            "compliance_score": 55.0,
            "risk_score": 32.0,
            "risk_level": "medium",
            "analysis_status": "completed",
        },
        {
            "gem_tender_id": "GEM/2024/B/1122334",
            "title": "Data Center Hardware",
            "department": "MeitY",
            "bid_value": 49500000.0,
            "due_date": "15 Oct 2025",
            "status": "draft",
            "compliance_score": None,
            "risk_score": None,
            "risk_level": None,
            "analysis_status": "pending",
        },
        {
            "gem_tender_id": "GEM/2024/B/9988776",
            "title": "Networking Equipment Supply",
            "department": "Department of Science & Technology",
            "bid_value": 24000000.0,
            "due_date": "28 Aug 2025",
            "status": "submitted",
            "compliance_score": 88.0,
            "risk_score": 10.0,
            "risk_level": "low",
            "analysis_status": "completed",
        },
    ]

    tender_objs = []
    for td in tenders_data:
        t = Tender(owner_id=user.id, **td)
        db.add(t)
        tender_objs.append(t)
    db.commit()
    for t in tender_objs:
        db.refresh(t)

    # ── Primary Tender: Full compliance data ──────────────────────────────────
    primary = tender_objs[0]

    # Bidder info
    bidder = BidderInfo(
        tender_id=primary.id,
        company_name="ABC Technologies Pvt. Ltd.",
        company_confidence=95.0,
        gstin="33ABCDE1234F1Z5",
        gstin_confidence=98.0,
        pan="ABCDE1234F",
        pan_confidence=97.0,
        cin="U74999TN2018PTC123456",
        cin_confidence=92.0,
        udyam_number="UDYAM-TN-12-345678",
        udyam_confidence=94.0,
        turnover="₹4.8 Cr (Average, Last 3 Years)",
        turnover_confidence=89.0,
        experience="5+ Years in IT hardware supply",
        experience_confidence=91.0,
        bank_details="SBI Account ending 4521, IFSC: SBIN0001234",
        bank_confidence=88.0,
        digital_signature="DSC Valid – Class 3, Expires Dec 2025",
        dsc_confidence=96.0,
    )
    db.add(bidder)

    # Requirements
    reqs = TENDER_REQUIREMENTS["laptop"]
    req_objs = []
    for rq in reqs:
        r = Requirement(tender_id=primary.id, **rq)
        db.add(r)
        req_objs.append(r)
    db.commit()
    for r in req_objs:
        db.refresh(r)

    # Compliance results
    for r in req_objs:
        demo = DEMO_COMPLIANCE_RESULTS.get(r.name, {
            "document_found": None, "status": "missing",
            "remarks": "Document not found.", "confidence": 0.0
        })
        cr = ComplianceResult(
            tender_id=primary.id,
            requirement_id=r.id,
            document_found=demo.get("document_found"),
            status=demo.get("status", "missing"),
            remarks=demo.get("remarks", ""),
            confidence=demo.get("confidence", 0.0),
            checked_at=datetime(2025, 9, 30, 11, 35, 0),
        )
        db.add(cr)

    # Verification results
    verifications = verification_service.run_all_verifications(
        "33ABCDE1234F1Z5", "ABCDE1234F", "U74999TN2018PTC123456", "UDYAM-TN-12-345678"
    )
    for v in verifications:
        vr = VerificationResult(
            tender_id=primary.id,
            verification_item=v["verification_item"],
            source_portal=v["source_portal"],
            status=v["status"],
            details=v["details"],
            verified_at=datetime(2025, 9, 30, 11, 12, 0),
        )
        db.add(vr)

    # Risk assessment
    ra = RiskAssessment(
        tender_id=primary.id,
        total_score=18.0,
        risk_level="low",
        missing_docs_score=10.0,
        invalid_docs_score=0.0,
        expired_certs_score=0.0,
        verification_failures_score=0.0,
        financial_inconsistency_score=0.0,
        eligibility_mismatch_score=0.0,
        blacklist_score=0.0,
        explanation="2 missing mandatory document(s) (+10 pts) | 1 item(s) need attention (+5 pts)",
        assessed_at=datetime(2025, 9, 30, 11, 35, 0),
    )
    db.add(ra)

    # ── Audit logs ────────────────────────────────────────────────────────────
    audit_events = [
        (primary.id, "document_uploaded", "Tender document uploaded: GEM_2024_B_5678901_Tender.pdf",
         datetime(2025, 9, 30, 10, 24, 0)),
        (primary.id, "analysis_started", "AI analysis started",
         datetime(2025, 9, 30, 10, 25, 0)),
        (primary.id, "analysis_completed", "AI analysis completed. Compliance score: 78.0%",
         datetime(2025, 9, 30, 10, 27, 0)),
        (primary.id, "verification_started", "Government portal verification started",
         datetime(2025, 9, 30, 11, 10, 0)),
        (primary.id, "verification_completed", "Government portal verification completed. All verifications passed.",
         datetime(2025, 9, 30, 11, 12, 0)),
        (primary.id, "compliance_checked", "Compliance check completed. Score: 78%",
         datetime(2025, 9, 30, 11, 35, 0)),
        (primary.id, "issues_identified", "Issues identified: 2 missing documents, 1 needs attention",
         datetime(2025, 9, 30, 11, 36, 0)),
        (tender_objs[1].id, "document_uploaded", "Tender submitted: GEM/2024/B/5432109",
         datetime(2025, 9, 25, 11, 2, 0)),
        (tender_objs[3].id, "bid_won", "Bid won: Cloud Infrastructure Services – GEM/2024/B/4455667",
         datetime(2025, 9, 15, 15, 0, 0)),
        (tender_objs[1].id, "compliance_checked", "Compliance check completed. Score: 91%",
         datetime(2025, 9, 24, 18, 45, 0)),
    ]

    for tid, etype, edesc, etime in audit_events:
        log = AuditLog(
            user_id=user.id,
            tender_id=tid,
            event_type=etype,
            event_description=edesc,
            status="success",
            created_at=etime,
        )
        db.add(log)

    db.commit()
    print("✅ Demo data seeded successfully!")
    print("📧 Email: vendor@complyai.demo")
    print("🔑 Password: demo123")
    print(f"📊 {len(tender_objs)} tenders created")
    print("🎯 Primary tender: GEM/2024/B/5678901 – Laptops – Ministry of Education")


if __name__ == "__main__":
    seed()
    db.close()
