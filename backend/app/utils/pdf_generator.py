"""
PDF Report Generator using ReportLab.
Generates a professional compliance report.
"""
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

BRAND_BLUE = colors.HexColor("#1E3A8A")
BRAND_LIGHT_BLUE = colors.HexColor("#3B82F6")
GREEN = colors.HexColor("#16A34A")
RED = colors.HexColor("#DC2626")
YELLOW = colors.HexColor("#D97706")
GRAY = colors.HexColor("#6B7280")
LIGHT_GRAY = colors.HexColor("#F3F4F6")
WHITE = colors.white


def generate_compliance_report(report_data: dict, output_path: str) -> str:
    """Generate a PDF compliance report and save to output_path"""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    heading_style = ParagraphStyle("heading", parent=styles["Heading1"], textColor=BRAND_BLUE,
                                    fontSize=18, spaceAfter=6)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], textColor=GRAY, fontSize=10)
    section_style = ParagraphStyle("section", parent=styles["Heading2"], textColor=BRAND_BLUE,
                                    fontSize=13, spaceBefore=12, spaceAfter=6)
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=9, leading=14)
    bold_style = ParagraphStyle("bold", parent=styles["Normal"], fontSize=9, fontName="Helvetica-Bold")

    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    story.append(Paragraph("ComplyAI by BidNirva", heading_style))
    story.append(Paragraph("AI-Powered Bid Compliance Verification Report", sub_style))
    story.append(Paragraph("⚠ DEMO MODE – Prototype Simulation. Not an official government document.", 
                            ParagraphStyle("warn", parent=styles["Normal"], textColor=YELLOW, fontSize=8)))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_BLUE, spaceAfter=12))

    # ── Tender Details ───────────────────────────────────────────────────────
    story.append(Paragraph("Tender Details", section_style))
    tender = report_data.get("tender", {})
    tender_table_data = [
        ["Tender ID", tender.get("gem_tender_id", "—"), "Department", tender.get("department", "—")],
        ["Tender Title", Paragraph(tender.get("title", "—"), body_style), "Bid Value",
         f"₹{tender.get('bid_value', 0):,.0f}"],
        ["Due Date", tender.get("due_date", "—"), "Status", tender.get("status", "—").upper()],
    ]
    tender_table = Table(tender_table_data, colWidths=[4*cm, 7*cm, 4*cm, 5*cm])
    tender_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(tender_table)
    story.append(Spacer(1, 12))

    # ── Compliance Score ─────────────────────────────────────────────────────
    story.append(Paragraph("Compliance Summary", section_style))
    score = report_data.get("compliance_score", 0)
    risk_level = report_data.get("risk_level", "low")
    risk_score = report_data.get("risk_score", 0)
    summary = report_data.get("compliance_summary", {})

    score_color = GREEN if score >= 75 else (YELLOW if score >= 50 else RED)
    score_data = [
        [Paragraph(f"<b>Overall Compliance Score: {score:.1f}%</b>", 
                   ParagraphStyle("sc", parent=styles["Normal"], fontSize=14, textColor=score_color)),
         Paragraph(f"<b>Risk Score: {risk_score:.0f}/100 ({risk_level.upper()} RISK)</b>",
                   ParagraphStyle("rc", parent=styles["Normal"], fontSize=11, 
                                  textColor=GREEN if risk_level == "low" else YELLOW if risk_level == "medium" else RED))],
        [f"Compliant: {summary.get('compliant', 0)} | Missing: {summary.get('missing', 0)} | "
         f"Needs Attention: {summary.get('needs_attention', 0)} | Not Applicable: {summary.get('not_applicable', 0)}", ""]
    ]
    score_table = Table(score_data, colWidths=[10*cm, 8*cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("SPAN", (0, 1), (-1, 1)),
        ("FONTSIZE", (0, 1), (-1, 1), 9),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 12))

    # ── Compliance Checklist ─────────────────────────────────────────────────
    story.append(Paragraph("Compliance Checklist", section_style))
    checklist_header = [["#", "Requirement", "Document Found", "Status", "Remarks"]]
    checklist_rows = []
    for i, r in enumerate(report_data.get("compliance_results", []), 1):
        status = r.get("status", "pending")
        status_color = GREEN if status == "compliant" else RED if status == "missing" else YELLOW
        checklist_rows.append([
            str(i),
            Paragraph(r.get("requirement_name", ""), body_style),
            Paragraph(r.get("document_found") or "—", body_style),
            Paragraph(f"<font color='{status_color.hexval() if hasattr(status_color, 'hexval') else '#000'}'>"
                     f"{status.replace('_', ' ').title()}</font>", body_style),
            Paragraph(r.get("remarks", ""), body_style),
        ])

    checklist_data = checklist_header + checklist_rows
    checklist_table = Table(checklist_data, colWidths=[1*cm, 5*cm, 4*cm, 3*cm, 5*cm])
    checklist_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(checklist_table)
    story.append(Spacer(1, 12))

    # ── Government Verification ───────────────────────────────────────────────
    story.append(Paragraph("Government Portal Verification (Demo/Mock)", section_style))
    ver_header = [["#", "Verification Item", "Source Portal", "Status", "Details"]]
    ver_rows = []
    for i, v in enumerate(report_data.get("verification_results", []), 1):
        st = v.get("status", "pending")
        ver_rows.append([
            str(i),
            v.get("verification_item", ""),
            v.get("source_portal", ""),
            st.upper(),
            Paragraph(v.get("details", "").replace("\n", ", "), body_style),
        ])
    ver_data = ver_header + ver_rows
    ver_table = Table(ver_data, colWidths=[1*cm, 4.5*cm, 4*cm, 2.5*cm, 6*cm])
    ver_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(ver_table)
    story.append(Spacer(1, 12))

    # ── Recommendations ───────────────────────────────────────────────────────
    story.append(Paragraph("AI Recommendations", section_style))
    recommendations = [
        "1. Upload all missing documents to complete compliance requirements.",
        "2. Review flagged items marked as 'Needs Attention' before submission.",
        "3. Ensure all certificates are within their validity period.",
        "4. Verify that EMD/Bid Security amount matches the tender requirement.",
        "5. Generate the final compliance report and submit your bid on GeM.",
    ]
    for rec in recommendations:
        story.append(Paragraph(rec, body_style))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY))
    story.append(Spacer(1, 6))
    now = datetime.now().strftime("%d %B %Y, %I:%M %p")
    story.append(Paragraph(
        f"Generated by ComplyAI by BidNirva | {now} | DEMO MODE – SIH Prototype",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=7, textColor=GRAY, alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        "This report is generated by a prototype system. Not an official government document.",
        ParagraphStyle("footer2", parent=styles["Normal"], fontSize=7, textColor=GRAY, alignment=TA_CENTER)
    ))

    doc.build(story)
    return output_path
