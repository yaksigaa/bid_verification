import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FileText, Download, Loader, Plus } from 'lucide-react'

const RISK_BADGE = {
  low:      { cls: 'badge-green',  label: 'Low Risk' },
  medium:   { cls: 'badge-yellow', label: 'Medium Risk' },
  high:     { cls: 'badge-red',    label: 'High Risk' },
  critical: { cls: 'badge-red',    label: 'Critical Risk' },
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const [rRes, tRes] = await Promise.all([
        api.get('/api/reports'),
        api.get('/api/tenders'),
      ])
      setReports(rRes.data)
      setTenders(tRes.data)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const generateForTender = async (tenderId) => {
    setGenerating(tenderId)
    try {
      const res = await api.post(`/api/reports/${tenderId}/generate`)
      toast.success(`Report ${res.data.report_id} generated!`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed.')
    } finally { setGenerating(null) }
  }

  const downloadReport = async (reportId) => {
    try {
      const res = await api.get(`/api/reports/${reportId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `ComplyAI_Report_${reportId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Download failed.') }
  }

  const fmtDate = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const analyzedTenders = tenders.filter(t => t.analysis_status === 'completed')

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h1>Compliance Reports</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
            View and download AI-generated compliance reports for your tender submissions.
          </p>
        </div>
      </div>

      {/* Generate new report section */}
      {analyzedTenders.length > 0 && reports.length === 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title"><Plus size={17} /> Generate a Report</div>
          <div style={{ fontSize: 13.5, color: 'var(--gray-600)', marginBottom: 14 }}>
            Generate compliance reports for your analyzed tenders.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {analyzedTenders.map(t => (
              <button key={t.id} className="btn btn-secondary"
                onClick={() => generateForTender(t.id)}
                disabled={generating === t.id}>
                {generating === t.id
                  ? <Loader size={14} className="spin" />
                  : <FileText size={14} />}
                {t.gem_tender_id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reports table */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <FileText size={48} style={{ color: 'var(--gray-300)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 8 }}>No Reports Yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--gray-500)', marginBottom: 20 }}>
            Run compliance check on a tender and generate your first report.
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/bids')}>
            Go to My Bids
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Tender ID</th>
                <th>Tender Name</th>
                <th>Compliance Score</th>
                <th>Risk Level</th>
                <th>Generated Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const rb = RISK_BADGE[r.risk_level] || RISK_BADGE.low
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--blue-700)', fontFamily: 'monospace' }}>
                        {r.report_id}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{r.gem_tender_id}</td>
                    <td style={{ fontWeight: 600, fontSize: 13, maxWidth: 200 }}>
                      <div className="truncate">{r.tender_title}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: 16,
                        color: r.compliance_score >= 75 ? 'var(--green-600)' : r.compliance_score >= 50 ? '#d97706' : 'var(--red-600)' }}>
                        {r.compliance_score?.toFixed(0) || 0}%
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${rb.cls}`}>{rb.label}</span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{fmtDate(r.generated_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadReport(r.report_id)}>
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate for analyzed tenders (below table if reports exist) */}
      {reports.length > 0 && analyzedTenders.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title"><Plus size={17} /> Generate Report for Another Tender</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {analyzedTenders.map(t => (
              <button key={t.id} className="btn btn-ghost btn-sm"
                onClick={() => generateForTender(t.id)}
                disabled={generating === t.id}>
                {generating === t.id ? <Loader size={13} /> : <FileText size={13} />}
                {t.gem_tender_id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
