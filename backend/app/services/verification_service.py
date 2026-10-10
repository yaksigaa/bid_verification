"""
Mock Government Verification Service
Architecture: BaseVerificationService → MockVerificationService
Future: Replace with RealGSTService, RealPANService, RealGeMService, etc.

IMPORTANT: This is DEMO/MOCK verification only.
No actual government API calls are made.
Clearly marked as prototype simulation.
"""
from datetime import datetime
from typing import Dict, Any, List


class BaseVerificationService:
    def verify_gst(self, gstin: str) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_pan(self, pan: str) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_mca(self, cin: str) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_gem_vendor(self, gstin: str) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_udyam(self, udyam: str) -> Dict[str, Any]:
        raise NotImplementedError

    def check_debarment(self, gstin: str, pan: str) -> Dict[str, Any]:
        raise NotImplementedError


class MockVerificationService(BaseVerificationService):
    """
    Simulates official government portal verification responses.
    Returns realistic demo data for SIH prototype.
    DEMO MODE – Not connected to real government APIs.
    """

    def verify_gst(self, gstin: str = "33ABCDE1234F1Z5") -> Dict[str, Any]:
        return {
            "verification_item": "GST Registration",
            "source_portal": "GSTN (gst.gov.in)",
            "status": "verified",
            "details": f"GSTIN: {gstin}\nActive – Since 12 Mar 2018",
            "raw_response": {
                "gstin": gstin,
                "status": "Active",
                "tradeName": "ABC Technologies Pvt. Ltd.",
                "registrationDate": "2018-03-12",
                "taxpayerType": "Regular",
                "note": "DEMO/MOCK – Prototype Simulation"
            }
        }

    def verify_pan(self, pan: str = "ABCDE1234F") -> Dict[str, Any]:
        return {
            "verification_item": "PAN Verification",
            "source_portal": "Income Tax (incometax.gov.in)",
            "status": "verified",
            "details": f"PAN: {pan}\nActive",
            "raw_response": {
                "pan": pan,
                "status": "Active",
                "name": "ABC TECHNOLOGIES PVT LTD",
                "panType": "Company",
                "note": "DEMO/MOCK – Prototype Simulation"
            }
        }

    def verify_mca(self, cin: str = "U74999TN2018PTC123456") -> Dict[str, Any]:
        return {
            "verification_item": "Organization Details",
            "source_portal": "MCA (mca.gov.in)",
            "status": "verified",
            "details": f"Company: ABC Pvt. Ltd.\nCIN: {cin}",
            "raw_response": {
                "cin": cin,
                "companyName": "ABC TECHNOLOGIES PRIVATE LIMITED",
                "status": "Active",
                "incorporationDate": "2018-03-01",
                "registeredState": "Tamil Nadu",
                "note": "DEMO/MOCK – Prototype Simulation"
            }
        }

    def verify_gem_vendor(self, gstin: str = "33ABCDE1234F1Z5") -> Dict[str, Any]:
        return {
            "verification_item": "GeM Vendor Registration",
            "source_portal": "GeM (gem.gov.in)",
            "status": "verified",
            "details": "GeM Seller ID: GEMV123456\nActive – L1 Verified",
            "raw_response": {
                "gemSellerId": "GEMV123456",
                "status": "Active",
                "level": "L1",
                "gstin": gstin,
                "category": "IT Hardware & Peripherals",
                "note": "DEMO/MOCK – Prototype Simulation"
            }
        }

    def verify_udyam(self, udyam: str = "UDYAM-TN-12-345678") -> Dict[str, Any]:
        return {
            "verification_item": "MSME / Udyam Registration",
            "source_portal": "Udyam (udyamregistration.gov.in)",
            "status": "verified",
            "details": f"Udyam No: {udyam}\nMicro Enterprise",
            "raw_response": {
                "udyamNumber": udyam,
                "enterpriseType": "Micro",
                "status": "Active",
                "registeredDate": "2020-07-01",
                "note": "DEMO/MOCK – Prototype Simulation"
            }
        }

    def check_debarment(self, gstin: str = "", pan: str = "") -> Dict[str, Any]:
        return {
            "verification_item": "Debarment / Blacklist Check",
            "source_portal": "GeM / CPPP",
            "status": "clear",
            "details": "No debarment records found.",
            "raw_response": {
                "debarred": False,
                "blacklisted": False,
                "cpppStatus": "Clear",
                "gemStatus": "Clear",
                "note": "DEMO/MOCK – Prototype Simulation"
            }
        }

    def run_all_verifications(self, gstin: str, pan: str, cin: str, udyam: str) -> List[Dict[str, Any]]:
        return [
            self.verify_gst(gstin),
            self.verify_pan(pan),
            self.verify_mca(cin),
            self.verify_gem_vendor(gstin),
            self.verify_udyam(udyam),
            self.check_debarment(gstin, pan),
        ]


# Singleton instance
verification_service = MockVerificationService()
