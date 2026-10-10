import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  CheckCircle, RefreshCw, Shield, AlertTriangle,
  ArrowRight, ExternalLink, Clock
} from 'lucide-react'

const RISK_COLORS = { low: '#16a34a', medium: '#d97706', high: '#dc2626', critical: '#7c2d12' }
const RISK_BG    = { low: '#dcfce7', medium: '#fef3c7', high: '#fee2e2', critical: '#fef2f2' }

const TECH_CHECKS = [
  { label: 'Turnover (Last 3 Years)', value: '₹4.8 Cr Average', status: 'verified' },
  { label: 'Experience', value: '5+ Years (As per documents)', status: 'verified' },
  { label: 'Bank Details (Cancelled Cheque)', value: 'Account matches with GST records', status: 'verified' },
  { label: 'Digital Signature', value: 'DSC verified and active', status: 'verified' },
  { label: 'Bid Security / EMD', value: 'As per tender requirement', status: 'verified' },
]

const NEXT_STEPS = [
  { label: 'Upload missing documents', path: (id) => `/tenders/${id}/compliance` },
  { label: 'Review and resolve flagged items', path: (id) => `/tenders/${id}/compliance` },
  { label: 'Generate final compliance report', path: () => null },
  { label: 'Submit bid on GeM', path: () => null },
]

export default function Verification() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [verifications, setVerifications] = useState([])
  const [risk, setRisk] = useState(null)
  const [tender, setTender] = useState(null)
  const [compliance, setCompliance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reverifying, setReverifying] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, vRes, rRes, cRes, aRes] = await Promise.all([
        api.get(`/api/tenders/${id}`),
        api.get(`/api/tenders/${id}/verify`),
        api.get(`/api/tenders/${id}/risk`),
        api.get(`/api/tenders/${id}/compliance`),
        api.get(`/api/tenders/${id}/audit`),
      ])
      setTender(tRes.data)
      setVerifications(vRes.data)
      setRisk(rRes.data)
      setCompliance(cRes.data)
      setAuditLogs(aRes.data)
    } catch {
      toast.error('Failed to load verification data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const reVerify = async () => {
    setReverifying(true)
    try {
      await api.post(`/api/tenders/${id}/verify`)
      toast.success('Re-verification complete!')
      load()
    } catch { toast.error('Re-verification failed.') }
    finally { setReverifying(false) }
  }

  if (loading) return <div className="page-content flex items-center justify-center"><div className="spinner" /></div>

  const riskLevel = risk?.risk_level || 'low'
  const riskScore = risk?.total_score || 0
  const riskColor = RISK_COLORS[riskLevel] || '#16a34a'
  const riskBg    = RISK_BG[riskLevel] || '#dcfce7'
  const riskGauge = [
    { value: riskScore, color: riskColor },
    { value: 100 - riskScore, color: '#e5e7eb' },
  ]

  const missing = compliance?.results?.filter(r => r.status === 'missing') || []

  const fmtTime = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="page-content-split">
      {/* Main */}
      <div className="page-main">
        {/* Breadcrumb */}
        <div style={{ fontSize: 12.5, color: 'var(--gray-500)', marginBottom: 10 }}>
          <span style={{ cursor: 'pointer', color: 'var(--blue-600)' }} onClick={() => navigate('/bids')}>My Bids</span>
          {' › '}
          <span>{tender?.gem_tender_id}</span>
        </div>

        <div className="page-header-row">
          <div>
            <h1>Verification & Government Portal Check</h1>
            <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
              Real-time verification with Government databases and GeM APIs.
            </p>
          </div>
        </div>

        {/* Verified banner */}
        <div className="ver-status-completed">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={20} style={{ color: 'var(--green-600)' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--green-700)' }}>Verification Completed</div>
              <div style={{ fontSize: 12, color: 'var(--green-600)' }}>
                All available details have been verified with government portals.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--gray-500)' }}>
              <div><Clock size={11} style={{ marginRight: 4 }} />Last Checked</div>
              <div>30 Sep 2025, 11:42 AM</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={reVerify} disabled={reverifying}>
              <RefreshCw size={13} className={reverifying ? 'spin' : ''} />
              Re-verify
            </button>
          </div>
        </div>

        {/* Government Portal Verification table */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              🏛️ Government Portal Verification
            </div>
            <span className="badge badge-green"><CheckCircle size={11} /> All Verifications Completed</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
            We verify your credentials with official government databases in real-time.
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Verification Item</th>
                  <th>Source Portal</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v, i) => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, fontSize: 13.5 }}>{v.verification_item}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--blue-700)' }}>{v.source_portal}</td>
                    <td>
                      <span className={`badge ${v.status === 'verified' || v.status === 'clear' ? 'badge-green' : 'badge-red'}`}>
                        <CheckCircle size={11} />
                        {v.status === 'clear' ? 'Clear' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-600)', whiteSpace: 'pre-line', maxWidth: 200 }}>
                      {v.details}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm">
                        <ExternalLink size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 14px', background: 'var(--yellow-50)', borderTop: '1px solid var(--yellow-100)', fontSize: 11.5, color: 'var(--yellow-600)', borderRadius: '0 0 8px 8px' }}>
            ⚠️ DEMO MODE – Mock verification. No real government APIs are accessed in this prototype.
          </div>
        </div>

        {/* Technical & Financial Verification */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              ⚙️ Technical & Financial Verification
            </div>
            {missing.length > 0 && (
              <span className="badge badge-red">
                <AlertTriangle size={11} /> {missing.length} Issues Found
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 14 }}>
            Validation of key parameters and eligibility criteria.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TECH_CHECKS.map(tc => (
              <div key={tc.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{tc.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{tc.value}</span>
                  <span className="badge badge-green"><CheckCircle size={11} /> Verified</span>
                </div>
              </div>
            ))}
          </div>
          {missing.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--red-600)', marginBottom: 8 }}>Issues Found:</div>
              {missing.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--red-50)', borderRadius: 8, marginBottom: 6, border: '1px solid var(--red-100)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: 'var(--red-600)', minWidth: 24 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.requirement_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{m.remarks}</div>
                    </div>
                  </div>
                  <span className="badge badge-red">Missing</span>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate(`/tenders/${id}/compliance`)}>
                View Missing Documents <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="page-aside">
        {/* Risk Assessment */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title"><Shield size={17} /> Risk Assessment</div>
          <div className="risk-gauge">
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskGauge} cx="50%" cy="50%" innerRadius={44} outerRadius={60}
                       dataKey="value" startAngle={90} endAngle={-270}>
                    {riskGauge.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{riskScore.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>/ 100</div>
              </div>
            </div>
            <div style={{ padding: '6px 14px', background: riskBg, borderRadius: 20, fontWeight: 800, fontSize: 13, color: riskColor }}>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </div>
            {risk?.explanation && (
              <div style={{ fontSize: 12, color: 'var(--gray-600)', textAlign: 'center', lineHeight: 1.4 }}>
                {risk.explanation}
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">✅ Next Steps</div>
          <div className="next-steps">
            {NEXT_STEPS.map((s, i) => (
              <div key={i} className="next-step-item"
                onClick={() => { const p = s.path(id); if (p) navigate(p) }}>
                <div className="next-step-num">{i + 1}</div>
                <div className="next-step-text">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>🕐 Recent Activity</div>
            <button onClick={() => navigate('/audit-trail')} style={{ fontSize: 12, color: 'var(--blue-600)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          <div className="timeline">
            {auditLogs.slice(0, 5).map((l, i) => (
              <div key={l.id} className="timeline-item">
                <div className="timeline-dot success"><CheckCircle size={13} /></div>
                <div className="timeline-content">
                  <div className="timeline-title" style={{ fontSize: 12 }}>{l.event_description}</div>
                  <div className="timeline-time">{fmtTime(l.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--green-50)', borderRadius: 8, border: '1px solid var(--green-100)', fontSize: 12, color: 'var(--green-700)' }}>
          <Shield size={13} style={{ marginRight: 6 }} />
          Your data is secure and processed as per Government of India data security guidelines.
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
