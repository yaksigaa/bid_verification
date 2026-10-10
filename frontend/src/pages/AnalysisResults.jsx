import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowRight, Edit3, CheckCircle } from 'lucide-react'

function ConfidenceBar({ value }) {
  const color = value >= 90 ? 'var(--green-500)' : value >= 70 ? '#f59e0b' : 'var(--red-600)'
  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar">
        <div className="conf-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="conf-pct">{value.toFixed(0)}%</span>
    </div>
  )
}

function InfoRow({ label, value, confidence }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
        <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 8px' }}>
          <CheckCircle size={10} /> Extracted
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 6 }}>{value || '—'}</div>
      {confidence !== undefined && <ConfidenceBar value={confidence} />}
    </div>
  )
}

export default function AnalysisResults() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tender, setTender] = useState(null)
  const [bidder, setBidder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/tenders/${id}`),
      api.get(`/api/tenders/${id}/bidder`),
    ]).then(([tRes, bRes]) => {
      setTender(tRes.data)
      setBidder(bRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="page-content flex items-center justify-center" style={{ height: '100%' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Analysis Results</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
            AI-extracted information from your tender documents. Review and proceed to compliance check.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/tenders/${id}/compliance`)}>
            Compliance Check <ArrowRight size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/tenders/${id}/verification`)}>
            View Verification <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Prototype notice */}
      <div className="alert alert-warning" style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <div>
          <strong>Prototype AI Extraction</strong> — Values shown are extracted using rule-based mock AI.
          Connect Tesseract OCR / Gemini API for production-grade extraction.
        </div>
      </div>

      <div className="grid-2">
        {/* Tender Info */}
        <div className="card">
          <div className="card-title">📄 Tender Information</div>
          {tender && [
            ['Tender ID', tender.gem_tender_id],
            ['Title', tender.title],
            ['Department', tender.department],
            ['Bid Value', tender.bid_value ? `₹${Number(tender.bid_value).toLocaleString('en-IN')}` : '—'],
            ['Due Date', tender.due_date],
            ['Analysis Status', tender.analysis_status?.toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{v || '—'}</span>
            </div>
          ))}
        </div>

        {/* Compliance summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card-title">📊 Compliance Preview</div>
          {tender?.compliance_score != null && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                fontSize: 52, fontWeight: 900,
                color: tender.compliance_score >= 75 ? 'var(--green-600)' : tender.compliance_score >= 50 ? '#d97706' : 'var(--red-600)',
                letterSpacing: -2
              }}>
                {tender.compliance_score.toFixed(0)}%
              </div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>Overall Compliance Score</div>
              <div className={`badge ${tender.compliance_score >= 75 ? 'badge-green' : tender.compliance_score >= 50 ? 'badge-yellow' : 'badge-red'}`} style={{ marginTop: 8 }}>
                {tender.compliance_score >= 75 ? '✅ Good Standing' : tender.compliance_score >= 50 ? '⚠️ Needs Attention' : '❌ Action Required'}
              </div>
            </div>
          )}
          <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}
            onClick={() => navigate(`/tenders/${id}/compliance`)}>
            View Full Compliance Check <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Bidder Info */}
      {bidder && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>🏢 Extracted Bidder Information</div>
            <button className="btn btn-ghost btn-sm">
              <Edit3 size={13} /> Edit Values
            </button>
          </div>
          <div className="grid-2">
            <div>
              <InfoRow label="Company Name" value={bidder.company_name} confidence={bidder.company_confidence} />
              <InfoRow label="GSTIN" value={bidder.gstin} confidence={bidder.gstin_confidence} />
              <InfoRow label="PAN Number" value={bidder.pan} confidence={bidder.pan_confidence} />
              <InfoRow label="CIN" value={bidder.cin} confidence={bidder.cin_confidence} />
              <InfoRow label="Udyam / MSME No." value={bidder.udyam_number} confidence={bidder.udyam_confidence} />
            </div>
            <div>
              <InfoRow label="Annual Turnover" value={bidder.turnover} confidence={bidder.turnover_confidence} />
              <InfoRow label="Experience" value={bidder.experience} confidence={bidder.experience_confidence} />
              <InfoRow label="Bank Details" value={bidder.bank_details} confidence={bidder.bank_confidence} />
              <InfoRow label="Digital Signature" value={bidder.digital_signature} confidence={bidder.dsc_confidence} />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate(`/tenders/${id}/compliance`)}>
          Proceed to Compliance Check <ArrowRight size={16} />
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/tenders/${id}/verification`)}>
          View Government Verification
        </button>
      </div>
    </div>
  )
}
