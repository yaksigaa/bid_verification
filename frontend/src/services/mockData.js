// src/services/mockData.js

const INITIAL_DATA = {
  tenders: [
    {
      id: 1,
      gem_tender_id: "GEM/2024/B/5678901",
      title: "Supply, Installation and Maintenance of Laptops",
      department: "Ministry of Education",
      bid_value: 12500000.0,
      due_date: "30 Sep 2025",
      status: "in_progress",
      compliance_score: 78.0,
      risk_score: 18.0,
      risk_level: "low",
      analysis_status: "completed",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      gem_tender_id: "GEM/2024/B/5432109",
      title: "Annual Supply of Office Stationery",
      department: "Ministry of Home Affairs",
      bid_value: 4850000.0,
      due_date: "25 Sep 2025",
      status: "submitted",
      compliance_score: 91.0,
      risk_score: 8.0,
      risk_level: "low",
      analysis_status: "completed",
      created_at: new Date().toISOString()
    }
  ],
  bidder: {
    company_name: "ABC Technologies Pvt. Ltd.", company_confidence: 95.0,
    gstin: "33ABCDE1234F1Z5", gstin_confidence: 98.0,
    pan: "ABCDE1234F", pan_confidence: 97.0,
    cin: "U74999TN2018PTC123456", cin_confidence: 92.0,
    udyam_number: "UDYAM-TN-12-345678", udyam_confidence: 94.0,
    turnover: "₹4.8 Cr (Average, Last 3 Years)", turnover_confidence: 89.0,
    experience: "5+ Years in IT hardware supply", experience_confidence: 91.0,
    bank_details: "SBI Account ending 4521, IFSC: SBIN0001234", bank_confidence: 88.0,
    digital_signature: "DSC Valid – Class 3, Expires Dec 2025", dsc_confidence: 96.0
  },
  compliance: {
    1: {
      compliance_score: 78.0,
      compliant: 12,
      missing: 2,
      needs_attention: 1,
      not_applicable: 0,
      results: [
        { id: 101, requirement_id: 1, requirement_name: "GST Registration Certificate", category: "Statutory", status: "compliant", document_found: "GST_Cert.pdf", remarks: "Valid and matches PAN." },
        { id: 102, requirement_id: 2, requirement_name: "OEM Authorization Certificate (MAF)", category: "Technical", status: "missing", document_found: null, remarks: "Not found in uploaded documents." },
        { id: 103, requirement_id: 3, requirement_name: "Turnover Certificate (Last 3 Years)", category: "Financial", status: "needs_attention", document_found: "Turnover.pdf", remarks: "Turnover matches but CA signature missing." },
        { id: 104, requirement_id: 4, requirement_name: "Experience Certificate", category: "Technical", status: "compliant", document_found: "Experience.pdf", remarks: "5 years experience confirmed." },
        { id: 105, requirement_id: 5, requirement_name: "PAN Card Copy", category: "Statutory", status: "compliant", document_found: "PAN_Card.pdf", remarks: "Verified." }
      ]
    },
    2: {
      compliance_score: 91.0,
      compliant: 15,
      missing: 0,
      needs_attention: 0,
      not_applicable: 2,
      results: []
    }
  },
  verifications: {
    1: [
      { id: 201, verification_item: "GST Registration", source_portal: "GSTN", status: "verified", details: "Active | Matches PAN" },
      { id: 202, verification_item: "PAN Verification", source_portal: "Income Tax", status: "verified", details: "Valid | Name matches" },
      { id: 203, verification_item: "Company Incorporation", source_portal: "MCA", status: "verified", details: "Active | Pvt Ltd" },
      { id: 204, verification_item: "MSME Status", source_portal: "Udyam", status: "verified", details: "Active | Micro Enterprise" },
      { id: 205, verification_item: "Debarment Check", source_portal: "GeM", status: "clear", details: "Not found in debarred list" }
    ],
    2: [
      { id: 206, verification_item: "GST Registration", source_portal: "GSTN", status: "verified", details: "Active | Matches PAN" },
      { id: 207, verification_item: "Debarment Check", source_portal: "GeM", status: "clear", details: "Not found in debarred list" }
    ]
  },
  risk: {
    1: {
      risk_level: "low",
      total_score: 18.0,
      explanation: "2 missing mandatory document(s) (+10 pts) | 1 item(s) need attention (+5 pts)"
    },
    2: {
      risk_level: "low",
      total_score: 8.0,
      explanation: "Minor inconsistencies found."
    }
  },
  audit: [
    { id: 301, tender_id: 1, gem_tender_id: "GEM/2024/B/5678901", tender_name: "Supply, Installation and Maintenance of Laptops", event_type: "document_uploaded", event_description: "Tender document uploaded", status: "success", created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 302, tender_id: 1, gem_tender_id: "GEM/2024/B/5678901", tender_name: "Supply, Installation and Maintenance of Laptops", event_type: "analysis_completed", event_description: "AI analysis completed. Compliance score: 78.0%", status: "success", created_at: new Date(Date.now() - 3500000).toISOString() },
    { id: 303, tender_id: 1, gem_tender_id: "GEM/2024/B/5678901", tender_name: "Supply, Installation and Maintenance of Laptops", event_type: "verification_completed", event_description: "Government portal verification completed.", status: "success", created_at: new Date(Date.now() - 3400000).toISOString() },
    { id: 304, tender_id: 2, gem_tender_id: "GEM/2024/B/5432109", tender_name: "Annual Supply of Office Stationery", event_type: "bid_won", event_description: "Bid won successfully.", status: "success", created_at: new Date(Date.now() - 86400000).toISOString() }
  ],
  reports: []
};

// Initialize localStorage with initial data if it doesn't exist
export function initDB() {
  if (!localStorage.getItem('complyai_db')) {
    localStorage.setItem('complyai_db', JSON.stringify(INITIAL_DATA));
  }
}

// Helper to get and set DB
export function getDB() {
  initDB();
  return JSON.parse(localStorage.getItem('complyai_db'));
}

export function saveDB(db) {
  localStorage.setItem('complyai_db', JSON.stringify(db));
}
