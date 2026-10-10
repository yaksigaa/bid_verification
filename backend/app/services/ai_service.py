"""
Mock AI Extraction Service
Architecture: BaseExtractionService → MockExtractionService
Future: Replace with RealAIService (Gemini/OpenAI/Tesseract OCR)
"""
import re
import random
from typing import Dict, Any


class BaseExtractionService:
    """Abstract base – swap implementation without changing API"""
    def extract(self, text: str, filename: str) -> Dict[str, Any]:
        raise NotImplementedError


class MockExtractionService(BaseExtractionService):
    """
    Rule-based mock extraction that simulates AI output.
    Returns realistic demo data for prototype demonstration.
    """

    # Demo vendor data – clearly fictional
    DEMO_VENDOR = {
        "company_name": "ABC Technologies Pvt. Ltd.",
        "company_confidence": 95.0,
        "gstin": "33ABCDE1234F1Z5",
        "gstin_confidence": 98.0,
        "pan": "ABCDE1234F",
        "pan_confidence": 97.0,
        "cin": "U74999TN2018PTC123456",
        "cin_confidence": 92.0,
        "udyam_number": "UDYAM-TN-12-345678",
        "udyam_confidence": 94.0,
        "turnover": "₹4.8 Cr (Average, Last 3 Years)",
        "turnover_confidence": 89.0,
        "experience": "5+ Years in IT hardware supply",
        "experience_confidence": 91.0,
        "bank_details": "SBI Account ending 4521, IFSC: SBIN0001234",
        "bank_confidence": 88.0,
        "digital_signature": "DSC Valid – Class 3, Expires Dec 2025",
        "dsc_confidence": 96.0,
    }

    TENDER_INFO_PATTERNS = {
        "GEM/2024/B/5678901": {
            "tender_id": "GEM/2024/B/5678901",
            "title": "Supply, Installation and Maintenance of Laptops",
            "department": "Ministry of Education",
            "bid_value": 12500000.0,
            "due_date": "30 September 2025",
        },
        "GEM/2024/B/5432109": {
            "tender_id": "GEM/2024/B/5432109",
            "title": "Annual Supply of Office Stationery",
            "department": "Ministry of Home Affairs",
            "bid_value": 4850000.0,
            "due_date": "25 September 2025",
        },
        "DEFAULT": {
            "tender_id": "GEM/2024/B/NEW001",
            "title": "Government Procurement Tender",
            "department": "Ministry of Finance",
            "bid_value": 5000000.0,
            "due_date": "31 December 2025",
        }
    }

    def extract(self, text: str, filename: str) -> Dict[str, Any]:
        """Extract tender and bidder info from text (or return demo data)"""
        # Try to match known tender IDs from filename or text
        tender_info = self._extract_tender_info(text, filename)
        bidder_info = self._extract_bidder_info(text)
        return {
            "tender_info": tender_info,
            "bidder_info": bidder_info,
            "extraction_method": "prototype_mock_ai",
            "confidence_overall": 93.5,
            "note": "Prototype AI extraction – connect real OCR/AI model for production"
        }

    def _extract_tender_info(self, text: str, filename: str) -> Dict[str, Any]:
        # Look for known tender IDs
        for tid, info in self.TENDER_INFO_PATTERNS.items():
            if tid != "DEFAULT":
                if tid in filename or tid in text or tid.replace("/", "_") in filename:
                    return info
        # Regex attempt
        match = re.search(r"GEM/\d{4}/[A-Z]/\d{7}", text or "")
        if match:
            tid = match.group()
            return self.TENDER_INFO_PATTERNS.get(tid, {
                **self.TENDER_INFO_PATTERNS["DEFAULT"],
                "tender_id": tid
            })
        return self.TENDER_INFO_PATTERNS["DEFAULT"]

    def _extract_bidder_info(self, text: str) -> Dict[str, Any]:
        """Try to extract real values, fall back to demo data"""
        result = dict(self.DEMO_VENDOR)
        if text:
            gstin = re.search(r'\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b', text)
            if gstin:
                result["gstin"] = gstin.group()
            pan = re.search(r'\b[A-Z]{5}\d{4}[A-Z]\b', text)
            if pan:
                result["pan"] = pan.group()
        return result

    def classify_document(self, filename: str, text: str) -> str:
        """Classify a document based on filename and content keywords"""
        filename_lower = filename.lower()
        text_lower = (text or "").lower()
        combined = filename_lower + " " + text_lower

        classifications = [
            (["gst", "gstin", "goods and service"], "GST Registration Certificate"),
            (["pan", "income tax"], "PAN Card"),
            (["oem", "authorization", "authorisation"], "OEM Authorization Certificate"),
            (["iso", "9001", "14001", "27001"], "ISO Certificate"),
            (["experience", "work order", "completion"], "Experience Certificate"),
            (["technical", "specification", "compliance sheet"], "Technical Compliance Sheet"),
            (["turnover", "balance sheet", "financial", "audited"], "Financial Turnover Document"),
            (["emd", "bid security", "earnest money"], "EMD / Bid Security"),
            (["undertaking", "declaration", "affidavit"], "Undertaking / Declaration"),
            (["covering", "cover letter", "bid letter"], "Bid Covering Letter"),
        ]
        for keywords, label in classifications:
            if any(k in combined for k in keywords):
                return label
        return "Supporting Document"


# Singleton instance – swap with RealAIService when ready
extraction_service = MockExtractionService()
