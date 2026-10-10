import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  CheckCircle, XCircle, AlertTriangle, FileText,
  Minus, Upload, ArrowRight, Download, Info
} from 'lucide-react'

const STATUS_CONFIG = {
  compliant:       { color: 'var(--green-600)', bg: 'var(--green-100)', icon: CheckCircle,    label: 'Compliant' },
  missing:         { color: 'var(--red-600)',   bg: 'var(--red-100)',   icon: XCircle,        label: 'Missing' },
  needs_attention: { color: '#d97706',           bg: 'var(--yellow-100)', icon: AlertTriangle, label: 'Needs Attention' },
  not_applicable:  { color: 'var(--gray-400)',   bg: 'var(--gray-100)', icon: Minus,          label: 'N/A' },
  pending:         { color: 'var(--gray-400)',   bg: 'var(--gray-100)', icon: Minus,          label: 'Pending' },
}

const TABS = ['Compliance Checklist', 'Missing / Invalid Documents', 'Verification Status', 'AI Remarks']

export default function ComplianceCheck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tender, setTender] = useState(null)
  const [compliance, setCompliance] = useState(null)
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [uploadingFor, setUploadingFor] = useState(null)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, cRes, vRes] = await Promise.all([
        api.get(`/api/tenders/${id}`),
        api.get(`/api/tenders/${id}/compliance`),
        api.get(`/api/tenders/${id}/verify`),
      ])
      setTender(tRes.data)
      setCompliance(cRes.data)
      setVerifications(vRes.data)
    } catch (e) {
      toast.error('Failed to load compliance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const generateReport = async () => {
    setGenerating(true)
    try {
      const res = await api.post(`/api/reports/${id}/generate`)
      toast.success(`Report generated: ${res.data.report_id}`)
      navigate('/reports')
    } catch {
      toast.error('Report generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handleMissingUpload = async (requirementId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('requirement_id', requirementId)
    try {
      const res = await api.post(`/api/tenders/${id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`Uploaded! New score: ${res.data.new_compliance_score}%`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed.')
    }
  }

  if (loading) return (
    <div className="page-content flex items-center justify-center">
      <div className="spinner" />
    </div>
  )

  const score = compliance?.compliance_score || 0
  const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const pieData = [
    { name: 'Compliant', value: compliance?.compliant || 0, color: '#16a34a' },
    { name: 'Missing', value: compliance?.missing || 0, color: '#dc2626' },
    { name: 'Needs Attention', value: compliance?.needs_attention || 0, color: '#d97706' },
    { name: 'Not Applicable', value: compliance?.not_applicable || 0, color: '#9ca3af' },
  ]

  const missing = compliance?.results?.filter(r => r.status === 'missing') || []

  return (
    <div className="page-content-split">
      <div className="page-main">
        {/* Page header */}
        <div className="page-header-row">
          <div>
            <h1>Compliance Check</h1>
            <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
              AI-powered verification of all mandatory and conditional requirements.
            </p>
          </div>
          {tender && (
            <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{tender.gem_tender_id}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{tender.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>{tender.department}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Due: {tender.due_date}</div>
              </div>
              <span className="badge badge-blue">In Progress</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t, i) => (
            <div key={t} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
              {t}
              {i === 1 && missing.length > 0 && (
                <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>
                  {missing.length}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Tab 0 – Checklist */}
        {tab === 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Requirement</th>
                  <th>Document Found</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(compliance?.results || []).map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                  const Icon = cfg.icon
                  return (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.requirement_name}</div>
                        {r.category && <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{r.category}</div>}
                      </td>
                      <td>
                        {r.document_found ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--blue-700)', fontSize: 13 }}>
                            <FileText size={13} />
                            {r.document_found}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--gray-600)', maxWidth: 220 }}>{r.remarks || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 1 – Missing docs */}
        {tab === 1 && (
          <div>
            {missing.length === 0 ? (
              <div className="alert alert-success">
                <CheckCircle size={16} /> All documents are present!
              </div>
            ) : (
              missing.map(r => (
                <div key={r.id} className="card" style={{ marginBottom: 12, border: '1px solid var(--red-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)', marginBottom: 4 }}>
                        <XCircle size={14} style={{ color: 'var(--red-600)', marginRight: 6 }} />
                        {r.requirement_name}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{r.remarks}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge-red">Missing</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setUploadingFor(r.requirement_id)
                          fileRef.current?.click()
                        }}
                      >
                        <Upload size={13} /> Upload
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files[0] && uploadingFor) {
                  handleMissingUpload(uploadingFor, e.target.files[0])
                  e.target.value = ''
                }
              }}
            />
          </div>
        )}

        {/* Tab 2 – Verification Status */}
        {tab === 2 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Verification Item</th>
                  <th>Source Portal</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v, i) => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{v.verification_item}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{v.source_portal}</td>
                    <td>
                      <span className={`badge ${v.status === 'verified' || v.status === 'clear' ? 'badge-green' : 'badge-red'}`}>
                        {v.status === 'verified' ? <CheckCircle size={11} /> : null}
                        {v.status === 'clear' ? '✓ Clear' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-600)', whiteSpace: 'pre-line' }}>
                      {v.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: 12, background: 'var(--yellow-50)', borderTop: '1px solid var(--yellow-100)', fontSize: 12, color: 'var(--yellow-600)' }}>
              ⚠️ DEMO MODE – Mock verification results. Not connected to real government APIs.
            </div>
          </div>
        )}

        {/* Tab 3 – AI Remarks */}
        {tab === 3 && (
          <div className="card">
            <div className="card-title"><Info size={16} /> AI Remarks & Recommendations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="alert alert-info">
                <Info size={15} />
                <div>You are close to full compliance. Please upload the missing documents to avoid rejection.</div>
              </div>
              {[
                { type: 'warning', msg: 'OEM Authorization Certificate is mandatory for laptop tenders. Upload it immediately.' },
                { type: 'warning', msg: 'Financial Turnover Documents (Last 3 Years) must include audited balance sheets.' },
                { type: 'info', msg: 'Undertaking / Declarations format differs from standard template. Review and resubmit.' },
                { type: 'success', msg: 'GST Registration verified successfully through GSTN portal.' },
                { type: 'success', msg: 'PAN card verified through Income Tax portal.' },
                { type: 'success', msg: 'ISO 9001:2015 Certificate is valid till December 2026.' },
              ].map((r, i) => (
                <div key={i} className={`alert alert-${r.type === 'warning' ? 'warning' : r.type === 'success' ? 'success' : 'info'}`}>
                  {r.type === 'warning' ? <AlertTriangle size={14} /> : r.type === 'success' ? <CheckCircle size={14} /> : <Info size={14} />}
                  <div style={{ fontSize: 13 }}>{r.msg}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar – Compliance Score */}
      <div className="page-aside">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Overall Compliance Score</div>
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData.filter(d => d.value > 0)} cx="50%" cy="50%"
                     innerRadius={52} outerRadius={72} dataKey="value" paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 38, fontWeight: 900, color: scoreColor, letterSpacing: -1.5, lineHeight: 1 }}>
              {score.toFixed(0)}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>Compliant</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                  {d.name}
                </div>
                <span style={{ fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div className="card" style={{ marginBottom: 14, background: 'var(--blue-50)', border: '1px solid var(--blue-100)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--blue-800)' }}>AI Insight</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--blue-700)', lineHeight: 1.5 }}>
            You are close to full compliance. Please upload the missing documents to avoid rejection.
          </div>
        </div>

        {/* Generate report */}
        <button
          className="btn btn-primary w-full"
          style={{ justifyContent: 'center', marginBottom: 10 }}
          onClick={generateReport}
          disabled={generating}
        >
          {generating ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <FileText size={15} />}
          Generate Compliance Report
        </button>

        <button className="btn btn-secondary w-full" style={{ justifyContent: 'center', marginBottom: 14 }}>
          <Download size={15} /> Download Checklist (PDF)
        </button>

        {/* Action Required */}
        {missing.length > 0 && (
          <div className="card" style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)' }}>
            <div style={{ fontWeight: 700, color: 'var(--red-600)', marginBottom: 6 }}>
              ⚠️ Action Required
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--red-600)', marginBottom: 12 }}>
              {missing.length} mandatory document{missing.length > 1 ? 's are' : ' is'} missing.
              Please upload them to complete your bid.
            </div>
            <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }}
              onClick={() => setTab(1)}>
              Go to Missing Documents <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
