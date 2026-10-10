from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    role = Column(String, default="vendor")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    tenders = relationship("Tender", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")


class Tender(Base):
    __tablename__ = "tenders"
    id = Column(Integer, primary_key=True, index=True)
    gem_tender_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    bid_value = Column(Float, nullable=True)
    due_date = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft/in_progress/submitted/won/not_qualified
    compliance_score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    analysis_status = Column(String, default="pending")  # pending/processing/completed/failed
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner = relationship("User", back_populates="tenders")
    documents = relationship("Document", back_populates="tender", cascade="all, delete-orphan")
    requirements = relationship("Requirement", back_populates="tender", cascade="all, delete-orphan")
    compliance_results = relationship("ComplianceResult", back_populates="tender", cascade="all, delete-orphan")
    verification_results = relationship("VerificationResult", back_populates="tender", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="tender", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="tender", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tender")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    doc_type = Column(String, nullable=True)  # tender_document / supporting_document / missing_upload
    classification = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    upload_status = Column(String, default="uploaded")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    tender = relationship("Tender", back_populates="documents")


class Requirement(Base):
    __tablename__ = "requirements"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)  # mandatory/conditional/financial/technical
    description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    tender = relationship("Tender", back_populates="requirements")
    compliance_results = relationship("ComplianceResult", back_populates="requirement", cascade="all, delete-orphan")


class ComplianceResult(Base):
    __tablename__ = "compliance_results"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    requirement_id = Column(Integer, ForeignKey("requirements.id"))
    document_found = Column(String, nullable=True)
    status = Column(String, default="pending")  # compliant/missing/needs_attention/not_applicable
    remarks = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)
    tender = relationship("Tender", back_populates="compliance_results")
    requirement = relationship("Requirement", back_populates="compliance_results")


class VerificationResult(Base):
    __tablename__ = "verification_results"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    verification_item = Column(String, nullable=False)
    source_portal = Column(String, nullable=True)
    status = Column(String, default="pending")  # verified/failed/pending
    details = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)
    tender = relationship("Tender", back_populates="verification_results")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    total_score = Column(Float, default=0)
    risk_level = Column(String, default="low")
    missing_docs_score = Column(Float, default=0)
    invalid_docs_score = Column(Float, default=0)
    expired_certs_score = Column(Float, default=0)
    verification_failures_score = Column(Float, default=0)
    financial_inconsistency_score = Column(Float, default=0)
    eligibility_mismatch_score = Column(Float, default=0)
    blacklist_score = Column(Float, default=0)
    explanation = Column(Text, nullable=True)
    assessed_at = Column(DateTime, default=datetime.utcnow)
    tender = relationship("Tender", back_populates="risk_assessments")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    compliance_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    tender = relationship("Tender", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String, nullable=False)
    event_description = Column(Text, nullable=False)
    status = Column(String, default="success")
    extra_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    tender = relationship("Tender", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")


# Extracted bidder info per tender
class BidderInfo(Base):
    __tablename__ = "bidder_info"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), unique=True)
    company_name = Column(String, nullable=True)
    company_confidence = Column(Float, default=0)
    gstin = Column(String, nullable=True)
    gstin_confidence = Column(Float, default=0)
    pan = Column(String, nullable=True)
    pan_confidence = Column(Float, default=0)
    cin = Column(String, nullable=True)
    cin_confidence = Column(Float, default=0)
    udyam_number = Column(String, nullable=True)
    udyam_confidence = Column(Float, default=0)
    turnover = Column(String, nullable=True)
    turnover_confidence = Column(Float, default=0)
    experience = Column(String, nullable=True)
    experience_confidence = Column(Float, default=0)
    bank_details = Column(String, nullable=True)
    bank_confidence = Column(Float, default=0)
    digital_signature = Column(String, nullable=True)
    dsc_confidence = Column(Float, default=0)
    extracted_at = Column(DateTime, default=datetime.utcnow)
