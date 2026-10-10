import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Upload, FileText, CheckSquare, Shield,
  Briefcase, BarChart2, ClipboardList, Settings, HelpCircle,
  Bell, ChevronDown, LogOut
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/upload', icon: Upload, label: 'Upload Tender' },
  { to: '/bids', icon: Briefcase, label: 'My Bids' },
  { to: '/compliance', icon: CheckSquare, label: 'Compliance Check', disabled: true },
  { to: '/verification', icon: Shield, label: 'Verification (APIs)', disabled: true },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/audit-trail', icon: ClipboardList, label: 'Audit Trail' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SK'

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-brand">
            <div className="logo-icon">CA</div>
            <div className="logo-text">
              <span className="logo-name">ComplyAI</span>
              <span className="logo-sub">by BidNirva</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.slice(0, 6).map(item => (
            item.disabled ? (
              <div key={item.to} className="nav-item" style={{ opacity: 0.4, cursor: 'default' }}>
                <item.icon size={17} />
                <span>{item.label}</span>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            )
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>System</div>
          {navItems.slice(6).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="gov-emblem">
            <div className="gov-emblem-icon">🏛️</div>
            <div className="gov-name">Government of India</div>
            <div className="gov-tagline">"Transparent Procurement Stronger India"</div>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="header-title">AI-Powered Bid Compliance</div>
            <div className="header-subtitle">for a Transparent GeM Procurement</div>
          </div>

          <div className="header-center">
            <div className="gem-badge">
              <div className="gem-star">⭐</div>
              <div className="gem-text">
                <span className="gem-text-name">GeM</span>
                <span className="gem-text-sub">Government e Marketplace</span>
              </div>
            </div>
            <div className="header-demo-badge">DEMO</div>
          </div>

          <div className="header-right">
            <button className="header-icon-btn">
              <Bell size={18} />
              <span className="notification-badge">3</span>
            </button>

            <div
              className="user-dropdown"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ position: 'relative' }}
            >
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <span className="user-name">{user?.full_name || 'Surya K'}</span>
                <span className="user-role">Vendor</span>
              </div>
              <ChevronDown size={15} style={{ color: 'var(--gray-400)' }} />

              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'white', border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)', padding: '8px', minWidth: '180px',
                  boxShadow: 'var(--shadow-lg)', zIndex: 100
                }}>
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--gray-100)', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, color: 'var(--gray-700)', cursor: 'pointer', border: 'none', background: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Settings size={14} /> Settings
                  </button>
                  <button
                    onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, color: 'var(--red-600)', cursor: 'pointer', border: 'none', background: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--red-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content rendered by child routes */}
        <Outlet />
      </div>
    </div>
  )
}
