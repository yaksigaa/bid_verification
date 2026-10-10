from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─── User ────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    organization: Optional[str]
    role: str
    class Config:
        from_attributes = True


# ─── Tender ──────────────────────────────────────────────────────────────────

class TenderOut(BaseModel):
    id: int
    gem_tender_id: str
    title: str
    department: Optional[str]
    bid_value: Optional[float]
    due_date: Optional[str]
    status: str
    compliance_score: Optional[float]
    risk_score: Optional[float]
    risk_level: Optional[str]
    analysis_status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


# ─── Document ────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    tender_id: int
    filename: str
    original_name: str
    file_size: Optional[int]
    doc_type: Optional[str]
    classification: Optional[str]
    upload_status: str
    uploaded_at: datetime
    class Config:
        from_attributes = True


# ─── Compliance ───────────────────────────────────────────────────────────────

class RequirementOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    description: Optional[str]
    is_mandatory: bool
    class Config:
        from_attributes = True

class ComplianceResultOut(BaseModel):
    id: int
    requirement_id: int
    requirement_name: str
    category: Optional[str]
    document_found: Optional[str]
    status: str
    remarks: Optional[str]
    confidence: Optional[float]
    checked_at: datetime
    class Config:
        from_attributes = True

class ComplianceSummary(BaseModel):
    tender_id: int
    compliance_score: float
    total: int
    compliant: int
    missing: int
    needs_attention: int
    not_applicable: int
    results: List[ComplianceResultOut]


# ─── Verification ─────────────────────────────────────────────────────────────

class VerificationResultOut(BaseModel):
    id: int
    verification_item: str
    source_portal: Optional[str]
    status: str
    details: Optional[str]
    verified_at: datetime
    class Config:
        from_attributes = True


# ─── Risk ─────────────────────────────────────────────────────────────────────

class RiskAssessmentOut(BaseModel):
    id: int
    tender_id: int
    total_score: float
    risk_level: str
    missing_docs_score: float
    invalid_docs_score: float
    expired_certs_score: float
    verification_failures_score: float
    financial_inconsistency_score: float
    eligibility_mismatch_score: float
    blacklist_score: float
    explanation: Optional[str]
    assessed_at: datetime
    class Config:
        from_attributes = True


# ─── Report ──────────────────────────────────────────────────────────────────

class ReportOut(BaseModel):
    id: int
    report_id: str
    tender_id: int
    tender_title: Optional[str]
    gem_tender_id: Optional[str]
    compliance_score: Optional[float]
    risk_level: Optional[str]
    generated_at: datetime
    class Config:
        from_attributes = True


# ─── Audit ───────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    tender_id: Optional[int]
    event_type: str
    event_description: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True


# ─── Bidder Info ─────────────────────────────────────────────────────────────

class BidderInfoOut(BaseModel):
    company_name: Optional[str]
    company_confidence: float
    gstin: Optional[str]
    gstin_confidence: float
    pan: Optional[str]
    pan_confidence: float
    cin: Optional[str]
    cin_confidence: float
    udyam_number: Optional[str]
    udyam_confidence: float
    turnover: Optional[str]
    turnover_confidence: float
    experience: Optional[str]
    experience_confidence: float
    bank_details: Optional[str]
    bank_confidence: float
    digital_signature: Optional[str]
    dsc_confidence: float
    class Config:
        from_attributes = True


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_bids: int
    in_progress: int
    submitted: int
    won: int
    not_qualified: int
    avg_compliance_score: float
    high_risk_bids: int
    recent_activity: List[AuditLogOut]
