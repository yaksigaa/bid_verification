from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Tender, AuditLog
from app.schemas import DashboardStats, AuditLogOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tenders = db.query(Tender).filter(Tender.owner_id == current_user.id).all()
    total = len(tenders)
    in_progress = sum(1 for t in tenders if t.status == "in_progress")
    submitted = sum(1 for t in tenders if t.status == "submitted")
    won = sum(1 for t in tenders if t.status == "won")
    not_qualified = sum(1 for t in tenders if t.status == "not_qualified")

    scores = [t.compliance_score for t in tenders if t.compliance_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    high_risk = sum(1 for t in tenders if t.risk_level in ("high", "critical"))

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(8)
        .all()
    )

    return {
        "total_bids": total,
        "in_progress": in_progress,
        "submitted": submitted,
        "won": won,
        "not_qualified": not_qualified,
        "avg_compliance_score": avg_score,
        "high_risk_bids": high_risk,
        "recent_activity": [
            {
                "id": l.id,
                "tender_id": l.tender_id,
                "event_type": l.event_type,
                "event_description": l.event_description,
                "status": l.status,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ]
    }
