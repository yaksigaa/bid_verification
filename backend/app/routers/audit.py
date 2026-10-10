from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, AuditLog, Tender
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/audit-trail", tags=["audit"])


@router.get("")
def get_audit_trail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all tenders for this user
    user_tender_ids = [t.id for t in db.query(Tender).filter(Tender.owner_id == current_user.id).all()]

    logs = (
        db.query(AuditLog)
        .filter(
            (AuditLog.user_id == current_user.id) |
            (AuditLog.tender_id.in_(user_tender_ids))
        )
        .order_by(AuditLog.created_at.desc())
        .limit(100)
        .all()
    )
    result = []
    for l in logs:
        tender_name = None
        gem_id = None
        if l.tender_id:
            tender = db.query(Tender).filter(Tender.id == l.tender_id).first()
            if tender:
                tender_name = tender.title
                gem_id = tender.gem_tender_id
        result.append({
            "id": l.id,
            "tender_id": l.tender_id,
            "gem_tender_id": gem_id,
            "tender_name": tender_name,
            "event_type": l.event_type,
            "event_description": l.event_description,
            "status": l.status,
            "created_at": l.created_at.isoformat(),
        })
    return result
