import { useEffect, useState } from 'react'
import api from '../services/api'
import {
  Upload, CheckCircle, Shield, FileText, AlertTriangle,
  Trophy, BarChart2, ClipboardList
} from 'lucide-react'

const EVENT_CONFIG = {
  document_uploaded:      { icon: Upload,       cls: 'info',    color: 'var(--blue-700)' },
  analysis_started:       { icon: BarChart2,    cls: 'info',    color: 'var(--blue-700)' },
  analysis_completed:     { icon: CheckCircle,  cls: 'success', color: 'var(--green-600)' },
  verification_started:   { icon: Shield,       cls: 'info',    color: 'var(--blue-700)' },
  verification_completed: { icon: Shield,       cls: 'success', color: 'var(--green-600)' },
  compliance_checked:     { icon: CheckCircle,  cls: 'success', color: 'var(--green-600)' },
  issues_identified:      { icon: AlertTriangle,cls: 'warning', color: '#d97706' },
  report_generated:       { icon: FileText,     cls: 'success', color: 'var(--green-600)' },
  bid_won:                { icon: Trophy,       cls: 'success', color: 'var(--green-600)' },
  default:                { icon: ClipboardList,cls: 'info',    color: 'var(--gray-500)' },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function fmtEvent(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/api/audit-trail').then(r => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.event_type.includes(filter))
  const eventTypes = ['all', ...new Set(logs.map(l => l.event_type))]

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h1>Audit Trail</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>
            Complete chronological record of all compliance workflow actions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Filter by event:</span>
          <select className="form-select" style={{ width: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
            {eventTypes.map(t => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Events' : fmtEvent(t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Shield size={15} />
        <div style={{ fontSize: 13 }}>
          All actions are immutably logged. This audit trail ensures full transparency and traceability of all compliance activities.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
          No audit events found.
        </div>
      ) : (
        <div className="card">
          <div className="timeline">
            {filtered.map((log, i) => {
              const cfg = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.default
              const Icon = cfg.icon
              return (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-dot ${cfg.cls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="timeline-title">{log.event_description}</div>
                        {log.tender_name && (
                          <div style={{ fontSize: 11.5, color: 'var(--blue-600)', marginTop: 2 }}>
                            {log.gem_tender_id} — {log.tender_name}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <span className={`badge ${log.status === 'success' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-time">{fmtDate(log.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)', fontSize: 12.5, color: 'var(--gray-500)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Shield size={15} />
        Audit logs are read-only and tamper-proof. All timestamps are in IST.
        Total events: {logs.length}
      </div>
    </div>
  )
}
