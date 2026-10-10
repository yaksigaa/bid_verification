import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Search, MoreVertical, Clock, CheckCircle, Trophy, XCircle, Loader } from 'lucide-react'

const STATUS_CONFIG = {
  in_progress:   { label: 'In Progress',  cls: 'badge-blue',   icon: Loader },
  submitted:     { label: 'Submitted',    cls: 'badge-green',  icon: CheckCircle },
  won:           { label: '🏆 Won',       cls: 'badge-green',  icon: Trophy },
  not_qualified: { label: 'Not Qualified',cls: 'badge-red',    icon: XCircle },
  draft:         { label: 'Draft',        cls: 'badge-gray',   icon: null },
}

const TABS = ['All Bids', 'In Progress', 'Submitted', 'Won', 'Not Qualified']
const TAB_FILTERS = [null, 'in_progress', 'submitted', 'won', 'not_qualified']

const DEADLINES = [
  { month: 'SEP', day: '30', title: 'Laptops for Educational Institutions', id: 'GEM/2024/B/5678901', time: '05:00 PM' },
  { month: 'SEP', day: '25', title: 'Office Stationery Supply', id: 'GEM/2024/B/5432109', time: '11:00 AM' },
  { month: 'OCT', day: '05', title: 'Smart Classroom Solutions', id: 'GEM/2024/B/2233445', time: '04:00 PM' },
]

export default function MyBids() {
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/tenders').then(r => setTenders(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = tenders.filter(t => {
    const matchTab = TAB_FILTERS[tab] === null || t.status === TAB_FILTERS[tab]
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.gem_tender_id.toLowerCase().includes(search.toLowerCase()) ||
      (t.department || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'All Departments' || t.department === deptFilter
    return matchTab && matchSearch && matchDept
  })

  const departments = ['All Departments', ...new Set(tenders.map(t => t.department).filter(Boolean))]

  const counts = {
    all: tenders.length,
    in_progress: tenders.filter(t => t.status === 'in_progress').length,
    submitted: tenders.filter(t => t.status === 'submitted').length,
    won: tenders.filter(t => t.status === 'won').length,
    not_qualified: tenders.filter(t => t.status === 'not_qualified').length,
  }
  const tabCounts = [counts.all, counts.in_progress, counts.submitted, counts.won, counts.not_qualified]

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtVal = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—'

  return (
    <div className="page-content-split">
      <div className="page-main">
        <div className="page-header-row">
          <div>
            <h1>My Bids</h1>
            <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Track and manage all your tender submissions in one place.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <Plus size={15} /> Upload New Tender
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t, i) => (
            <div key={t} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
              {t} ({tabCounts[i]})
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by tender ID, title or department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Tender Details</th>
                  <th>Department</th>
                  <th>Bid Value</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                      No bids found.
                    </td>
                  </tr>
                ) : filtered.map((t, i) => {
                  const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft
                  const isInProgress = t.status === 'in_progress' || t.status === 'draft'
                  return (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gray-900)' }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--blue-600)', marginTop: 2 }}>{t.gem_tender_id}</div>
                        {t.compliance_score != null && (
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                            Compliance: {t.compliance_score.toFixed(0)}%
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{t.department || '—'}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{fmtVal(t.bid_value)}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} />
                          {t.due_date || fmtDate(t.created_at)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isInProgress ? (
                            <button className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/tenders/${t.id}/compliance`)}>
                              Continue
                            </button>
                          ) : (
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/tenders/${t.id}/compliance`)}>
                              View
                            </button>
                          )}
                          <button className="btn btn-ghost btn-icon" title="More options">
                            <MoreVertical size={15} />
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
      </div>

      {/* Sidebar */}
      <div className="page-aside">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title"><Clock size={17} /> Upcoming Deadlines</div>
          {DEADLINES.map(d => (
            <div key={d.id} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ background: 'var(--blue-900)', color: 'white', borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700 }}>{d.month}</div>
                <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{d.day}</div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{d.title}</div>
                <div style={{ fontSize: 11, color: 'var(--blue-600)' }}>{d.id}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{d.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 14, background: 'var(--green-50)', border: '1px solid var(--green-100)' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🏆</div>
          <div style={{ fontWeight: 800, color: 'var(--green-700)', fontSize: 15 }}>
            {counts.won} Bid Won
          </div>
          <div style={{ fontSize: 12, color: 'var(--green-600)' }}>Keep going! You're making an impact.</div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'var(--gray-50)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)' }}>{counts.all}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Total Bids</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'var(--blue-50)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-900)' }}>
                {tenders.filter(t => t.compliance_score != null).length > 0
                  ? Math.round(tenders.filter(t => t.compliance_score != null).reduce((a, t) => a + t.compliance_score, 0) / tenders.filter(t => t.compliance_score != null).length)
                  : 0}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Avg. Compliance</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--yellow-50)', border: '1px solid var(--yellow-100)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--yellow-600)', marginBottom: 6 }}>💡 Tip</div>
          <div style={{ fontSize: 12, color: 'var(--yellow-600)', marginBottom: 10, lineHeight: 1.5 }}>
            Enable email notifications to stay updated on tender status and deadlines.
          </div>
          <button className="btn btn-sm" style={{ background: 'var(--yellow-600)', color: 'white' }}>
            Enable Now →
          </button>
        </div>
      </div>
    </div>
  )
}
