"""
Compliance Rule Engine
Configurable, data-driven rules for different tender types.
Architecture: Rules are defined as dicts → can be stored in DB later.
"""
from typing import List, Dict, Any


# ─── Tender-Type Requirements ─────────────────────────────────────────────────

TENDER_REQUIREMENTS = {
    "laptop": [
        {"name": "Bid Covering Letter", "category": "mandatory", "is_mandatory": True,
         "description": "Formal bid submission letter from vendor"},
        {"name": "GST Registration Certificate", "category": "mandatory", "is_mandatory": True,
         "description": "Valid GSTN registration certificate"},
        {"name": "PAN Card of the Organization", "category": "mandatory", "is_mandatory": True,
         "description": "PAN card as proof of tax identity"},
        {"name": "OEM Authorization Certificate", "category": "mandatory", "is_mandatory": True,
         "description": "Authorization from Original Equipment Manufacturer"},
        {"name": "ISO 9001:2015 Certificate", "category": "technical", "is_mandatory": True,
         "description": "Quality management certification"},
        {"name": "Experience Certificate (Last 3 Years)", "category": "mandatory", "is_mandatory": True,
         "description": "Minimum 3 years experience in IT hardware supply"},
        {"name": "Technical Specification Compliance Sheet", "category": "technical", "is_mandatory": True,
         "description": "Point-by-point compliance with tender technical specs"},
        {"name": "Financial Turnover Documents (Last 3 Years)", "category": "financial", "is_mandatory": True,
         "description": "Audited balance sheets showing minimum turnover"},
        {"name": "EMD / Bid Security", "category": "mandatory", "is_mandatory": True,
         "description": "Earnest Money Deposit as per tender value"},
        {"name": "Undertaking / Declarations", "category": "mandatory", "is_mandatory": True,
         "description": "Statutory declarations and undertakings"},
        {"name": "MSME / Udyam Registration", "category": "conditional", "is_mandatory": False,
         "description": "MSME registration for applicable benefits"},
        {"name": "Bank Guarantee", "category": "financial", "is_mandatory": False,
         "description": "Bank guarantee for performance security"},
    ],
    "stationery": [
        {"name": "Bid Covering Letter", "category": "mandatory", "is_mandatory": True,
         "description": "Formal bid submission letter from vendor"},
        {"name": "GST Registration Certificate", "category": "mandatory", "is_mandatory": True,
         "description": "Valid GSTN registration certificate"},
        {"name": "PAN Card of the Organization", "category": "mandatory", "is_mandatory": True,
         "description": "PAN card as proof of tax identity"},
        {"name": "Experience Certificate", "category": "mandatory", "is_mandatory": True,
         "description": "Proof of experience in stationery supply"},
        {"name": "Financial Turnover Documents", "category": "financial", "is_mandatory": True,
         "description": "Audited financial statements"},
        {"name": "EMD / Bid Security", "category": "mandatory", "is_mandatory": True,
         "description": "Earnest Money Deposit"},
        {"name": "Undertaking / Declarations", "category": "mandatory", "is_mandatory": True,
         "description": "Statutory undertakings"},
        {"name": "MSME / Udyam Registration", "category": "conditional", "is_mandatory": False,
         "description": "MSME registration"},
    ],
    "default": [
        {"name": "Bid Covering Letter", "category": "mandatory", "is_mandatory": True,
         "description": "Formal bid submission letter"},
        {"name": "GST Registration Certificate", "category": "mandatory", "is_mandatory": True,
         "description": "Valid GST certificate"},
        {"name": "PAN Card of the Organization", "category": "mandatory", "is_mandatory": True,
         "description": "PAN identity document"},
        {"name": "Experience Certificate", "category": "mandatory", "is_mandatory": True,
         "description": "Proof of relevant experience"},
        {"name": "Financial Turnover Documents", "category": "financial", "is_mandatory": True,
         "description": "Audited financial statements"},
        {"name": "EMD / Bid Security", "category": "mandatory", "is_mandatory": True,
         "description": "Earnest Money Deposit"},
        {"name": "Undertaking / Declarations", "category": "mandatory", "is_mandatory": True,
         "description": "Statutory undertakings"},
    ]
}

# ─── Demo compliance results for the laptop tender ─────────────────────────

DEMO_COMPLIANCE_RESULTS = {
    "Bid Covering Letter": {
        "document_found": "cover_letter.pdf",
        "status": "compliant",
        "remarks": "Valid document found.",
        "confidence": 95.0
    },
    "GST Registration Certificate": {
        "document_found": "gst_certificate.pdf",
        "status": "compliant",
        "remarks": "Verified through GST API.",
        "confidence": 98.0
    },
    "PAN Card of the Organization": {
        "document_found": "pan_card.pdf",
        "status": "compliant",
        "remarks": "Verified through Income Tax API.",
        "confidence": 97.0
    },
    "OEM Authorization Certificate": {
        "document_found": None,
        "status": "missing",
        "remarks": "Not found in uploaded documents.",
        "confidence": 0.0
    },
    "ISO 9001:2015 Certificate": {
        "document_found": "iso_certificate.pdf",
        "status": "compliant",
        "remarks": "Valid till 14 Dec 2026.",
        "confidence": 93.0
    },
    "Experience Certificate (Last 3 Years)": {
        "document_found": "experience.pdf",
        "status": "compliant",
        "remarks": "Meets eligibility criteria.",
        "confidence": 91.0
    },
    "Technical Specification Compliance Sheet": {
        "document_found": "tech_compliance.pdf",
        "status": "compliant",
        "remarks": "All mandatory specs covered.",
        "confidence": 90.0
    },
    "Financial Turnover Documents (Last 3 Years)": {
        "document_found": None,
        "status": "missing",
        "remarks": "Upload audited balance sheets.",
        "confidence": 0.0
    },
    "EMD / Bid Security": {
        "document_found": "emd.pdf",
        "status": "compliant",
        "remarks": "Valid and as per tender value.",
        "confidence": 96.0
    },
    "Undertaking / Declarations": {
        "document_found": "undertaking.pdf",
        "status": "needs_attention",
        "remarks": "Format differs. Review required.",
        "confidence": 72.0
    },
    "MSME / Udyam Registration": {
        "document_found": "udyam.pdf",
        "status": "compliant",
        "remarks": "Micro Enterprise – UDYAM-TN-12-345678.",
        "confidence": 94.0
    },
    "Bank Guarantee": {
        "document_found": None,
        "status": "not_applicable",
        "remarks": "Not required for this tender value.",
        "confidence": 0.0
    },
}


def get_requirements_for_tender(title: str) -> List[Dict[str, Any]]:
    """Return requirements list based on tender type"""
    title_lower = title.lower()
    if any(k in title_lower for k in ["laptop", "computer", "it equipment", "hardware", "software"]):
        return TENDER_REQUIREMENTS["laptop"]
    elif any(k in title_lower for k in ["stationery", "paper", "office supply"]):
        return TENDER_REQUIREMENTS["stationery"]
    else:
        return TENDER_REQUIREMENTS["default"]


def run_compliance_check(requirements: list, uploaded_docs: list) -> List[Dict[str, Any]]:
    """
    Rule engine: match requirements against uploaded documents.
    Returns compliance results per requirement.
    """
    doc_names = [d.lower() for d in uploaded_docs]
    results = []

    for req in requirements:
        req_name = req.name if hasattr(req, 'name') else req["name"]
        demo_result = DEMO_COMPLIANCE_RESULTS.get(req_name, {
            "document_found": None,
            "status": "missing",
            "remarks": "Document not found.",
            "confidence": 0.0
        })
        results.append({
            "requirement_name": req_name,
            **demo_result
        })
    return results


def calculate_compliance_score(results: list) -> float:
    """
    Formula: (compliant / total_applicable) * 100
    """
    applicable = [r for r in results if r.status != "not_applicable"]
    if not applicable:
        return 0.0
    compliant = [r for r in applicable if r.status == "compliant"]
    return round((len(compliant) / len(applicable)) * 100, 1)
