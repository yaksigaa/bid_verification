"""
Risk Scoring Module
Calculates risk score per category, returns level and explanation.
Score: 0–100, Level: Low/Medium/High/Critical
"""
from typing import Dict, Any, List


RISK_WEIGHTS = {
    "missing_mandatory_doc": 20,
    "invalid_document": 15,
    "expired_certificate": 15,
    "verification_failure": 25,
    "financial_inconsistency": 20,
    "eligibility_mismatch": 25,
    "blacklist_debarment": 50,
    "needs_attention": 5,
}

RISK_LEVELS = [
    (0, 25, "Low Risk", "low"),
    (26, 50, "Medium Risk", "medium"),
    (51, 75, "High Risk", "high"),
    (76, 100, "Critical Risk", "critical"),
]


def get_risk_level(score: float) -> tuple:
    for low, high, label, key in RISK_LEVELS:
        if low <= score <= high:
            return label, key
    return "Critical Risk", "critical"


def calculate_risk_score(compliance_results: list, verification_results: list) -> Dict[str, Any]:
    """
    Calculate risk score from compliance and verification results.
    Returns detailed breakdown.
    """
    score = 0.0
    missing_docs = 0
    invalid_docs = 0
    needs_attention = 0
    verification_failures = 0
    blacklisted = False
    explanation_parts = []

    # Compliance-based risk
    for r in compliance_results:
        status = r.status if hasattr(r, 'status') else r.get('status', '')
        if status == "missing":
            missing_docs += 1
        elif status == "needs_attention":
            needs_attention += 1

    # Verification-based risk
    for v in verification_results:
        v_status = v.status if hasattr(v, 'status') else v.get('status', '')
        item = v.verification_item if hasattr(v, 'verification_item') else v.get('verification_item', '')
        if v_status == "failed":
            verification_failures += 1
        if "debarment" in item.lower() and v_status not in ("clear", "verified"):
            blacklisted = True

    missing_score = min(missing_docs * RISK_WEIGHTS["missing_mandatory_doc"], 40)
    attention_score = min(needs_attention * RISK_WEIGHTS["needs_attention"], 15)
    verification_score = min(verification_failures * RISK_WEIGHTS["verification_failure"], 50)
    blacklist_score = RISK_WEIGHTS["blacklist_debarment"] if blacklisted else 0

    total = min(missing_score + attention_score + verification_score + blacklist_score, 100)

    if missing_score > 0:
        explanation_parts.append(f"{missing_docs} missing mandatory document(s) (+{missing_score} pts)")
    if attention_score > 0:
        explanation_parts.append(f"{needs_attention} item(s) need attention (+{attention_score} pts)")
    if verification_score > 0:
        explanation_parts.append(f"{verification_failures} government verification failure(s) (+{verification_score} pts)")
    if blacklist_score > 0:
        explanation_parts.append("Debarment/blacklist flag detected (+50 pts)")
    if not explanation_parts:
        explanation_parts.append("All verifications passed. No significant risks detected.")

    label, key = get_risk_level(total)

    return {
        "total_score": total,
        "risk_level": key,
        "risk_label": label,
        "missing_docs_score": missing_score,
        "invalid_docs_score": invalid_docs * RISK_WEIGHTS["invalid_document"],
        "expired_certs_score": 0,
        "verification_failures_score": verification_score,
        "financial_inconsistency_score": 0,
        "eligibility_mismatch_score": 0,
        "blacklist_score": blacklist_score,
        "explanation": " | ".join(explanation_parts)
    }
