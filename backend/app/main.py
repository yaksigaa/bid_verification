"""
ComplyAI FastAPI Backend – Main Application Entry Point
SIH Prototype by BidNirva
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine
from app.models import (
    User, Tender, Document, Requirement, ComplianceResult,
    VerificationResult, RiskAssessment, Report, AuditLog, BidderInfo
)
from app.database import Base
from app.routers import auth, dashboard, tenders, reports, audit

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ComplyAI API",
    description="AI-Powered Bid Compliance Verification Platform for GeM Procurement – SIH Prototype by BidNirva",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS – allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(tenders.router)
app.include_router(reports.router)
app.include_router(audit.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "running",
        "app": "ComplyAI by BidNirva",
        "version": "1.0.0",
        "mode": "DEMO – SIH Prototype",
        "note": "Mock government API verifications. No real government systems are accessed."
    }


@app.get("/")
def root():
    return {"message": "ComplyAI API is running. Visit /api/docs for documentation."}
