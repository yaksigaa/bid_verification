import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Upload, CheckCircle, AlertTriangle, Trophy, TrendingUp,
  Clock, ArrowRight, FileText, BarChart2, Shield
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const EVENT_ICONS = {
  document_uploaded: { icon: Upload, cls: 'blue', label: 'Uploaded' },
  analysis_completed: { icon: CheckCircle, cls: 'success', label: 'Analyzed' },
  compliance_checked: { icon: CheckCircle, cls: 'success', label: 'Checked' },
  verification_completed: { icon: Shield, cls: 'success', label: 'Verified' },
  report_generated: { icon: FileText, cls: 'info', label: 'Report' },
  issues_identified: { icon: AlertTriangle, cls: 'warning', label: 'Issues' },
  bid_won: { icon: Trophy, cls: 'success', label: 'Won' },
  default: { icon: FileText, cls: 'info', label: 'Event' },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="spinner" />
        <div style={{ color: 'var(--gray-500)' }}>Loading dashboard…</div>
      </div>
    </div>
  )

  const s = stats || {}
  const complianceData = [
    { name: 'Compliant', value: 12, color: '#16a34a' },
    { name: 'Missing', value: 3, color: '#dc2626' },
    { name: 'Attention', value: 1, color: '#d97706' },
  ]

  const kpiCards = [
    { label: 'Total Bids', value: s.total_bids || 8, color: '#1E3A8A', bg: '#dbeafe', icon: '📋' },
    { label: 'In Progress', value: s.in_progress || 2, color: '#d97706', bg: '#fef3c7', icon: '⏳' },
    { label: 'Submitted', value: s.submitted || 3, color: '#2563eb', bg: '#dbeafe', icon: '📤' },
    { label: 'Won', value: s.won || 1, color: '#16a34a', bg: '#dcfce7', icon: '🏆' },
    { label: 'Avg. Compliance', value: `${s.avg_compliance_score || 78}%`, color: '#1E3A8A', bg: '#dbeafe', icon: '📊' },
    { label: 'High Risk Bids', value: s.high_risk_bids || 1, color: '#dc2626', bg: '#fee2e2', icon: '⚠️' },
  ]

  const upcoming = [
    { date: 'SEP 30', title: 'Laptops for Educational Institutions', id: 'GEM/2024/B/5678901', time: '05:00 PM' },
    { date: 'SEP 25', title: 'Office Stationery Supply', id: 'GEM/2024/B/5432109', time: '11:00 AM' },
    { date: 'OCT 05', title: 'Smart Classroom Solutions', id: 'GEM/2024/B/2233445', time: '04:00 PM' },
  ]

  return (
    <div className="page-content-split">
      <div className="page-main">
        {/* Hero Banner */}
        <div className="dashboard-hero">
          <div>
            <div className="dashboard-hero-title">Welcome to ComplyAI</div>
            <div className="dashboard-hero-sub">Upload • Verify • Ensure Compliance • Bid with Confidence</div>
          </div>
          <div style={{ textAlign: 'right', zIndex: 1 }}>
            <div className="dashboard-hero-tag">Smarter Compliance.</div>
            <div className="dashboard-hero-tag">Stronger Procurement.</div>
            <button
              onClick={() => navigate('/upload')}
              className="btn"
              style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Upload size={15} /> Upload New Tender <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          {kpiCards.map(c => (
            <div key={c.label} className="kpi-card">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 4 }}>
                {c.icon}
              </div>
              <div className="kpi-label">{c.label}</div>
              <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Compliance Overview Chart + Quick Actions */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-title"><BarChart2 size={17} /> Compliance Overview</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={complianceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                     dataKey="value" paddingAngle={3}>
                  {complianceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-title"><ArrowRight size={17} /> Quick Actions</div>
            {[
              { icon: Upload, label: 'Upload New Tender', sub: 'Start compliance workflow', path: '/upload', color: 'var(--blue-900)' },
              { icon: CheckCircle, label: 'Run Compliance Check', sub: 'Select a tender to check', path: '/bids', color: 'var(--green-600)' },
              { icon: BarChart2, label: 'View Reports', sub: 'Download generated reports', path: '/reports', color: 'var(--blue-600)' },
            ].map(a => (
              <div key={a.label}
                onClick={() => navigate(a.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, border: '1px solid var(--gray-200)', transition: 'all 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                  <a.icon size={17} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{a.sub}</div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--gray-400)', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>
            <Clock size={17} /> Recent Activity
            <button onClick={() => navigate('/audit-trail')} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: 12 }}>
              View All
            </button>
          </div>
          <div className="timeline">
            {(s.recent_activity || []).slice(0, 6).map((log, i) => {
              const ev = EVENT_ICONS[log.event_type] || EVENT_ICONS.default
              return (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-dot ${ev.cls}`}><ev.icon size={14} /></div>
                  <div className="timeline-content">
                    <div className="timeline-title">{log.event_description}</div>
                    <div className="timeline-time">{fmtDate(log.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="page-aside">
        {/* Upcoming Deadlines */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">
            <Clock size={17} /> Upcoming Deadlines
            <span style={{ fontSize: 12, color: 'var(--blue-600)', marginLeft: 'auto', cursor: 'pointer' }}>View All</span>
          </div>
          {upcoming.map(u => (
            <div key={u.id} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{
                background: 'var(--blue-900)', color: 'white', borderRadius: 8,
                padding: '4px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 44
              }}>
                {u.date}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray-800)' }}>{u.title}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{u.id}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{u.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'var(--green-50)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-600)' }}>🏆</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>{s.won || 1}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Bid Won</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'var(--blue-50)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>{s.total_bids || 8}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Total Bids</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'var(--blue-50)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue-900)' }}>{s.avg_compliance_score || 78}%</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Avg Score</div>
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="card" style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            <Shield size={16} style={{ color: 'var(--green-600)' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-700)' }}>Your data is secure</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--green-700)' }}>
            We follow Government of India data security guidelines.
          </div>
        </div>
      </div>
    </div>
  )
}
