import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { User, Bell, Lock, Monitor, Save, Eye, EyeOff } from 'lucide-react'

const SECTIONS = ['Profile', 'Notifications', 'Security', 'Application']
const SECTION_ICONS = [User, Bell, Lock, Monitor]

export default function Settings() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState(0)
  const [showPwd, setShowPwd] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true, compliance: true, deadline: true, weekly: false
  })
  const [profile, setProfile] = useState({
    name: user?.full_name || 'Surya K',
    email: user?.email || 'vendor@complyai.demo',
    org: user?.organization || 'ABC Technologies Pvt. Ltd.',
    phone: '+91 98765 43210',
  })
  const [theme, setTheme] = useState('light')

  const saveProfile = () => toast.success('Profile updated successfully!')
  const savePassword = () => toast.success('Password changed. Please log in again.')
  const saveNotifications = () => toast.success('Notification preferences saved!')

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Settings</h1>
        <p style={{ color: 'var(--gray-500)' }}>Manage your account preferences and application settings.</p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar nav */}
        <div style={{ gridColumn: '1 / 2' }}>
          <div className="card" style={{ padding: 8 }}>
            {SECTIONS.map((s, i) => {
              const Icon = SECTION_ICONS[i]
              return (
                <button key={s}
                  onClick={() => setActiveSection(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                    background: activeSection === i ? 'var(--blue-900)' : 'transparent',
                    color: activeSection === i ? 'white' : 'var(--gray-700)',
                    fontWeight: activeSection === i ? 700 : 500, fontSize: 13.5,
                    transition: 'all 0.15s'
                  }}>
                  <Icon size={16} /> {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ gridColumn: '2 / 3' }}>
          {/* Profile */}
          {activeSection === 0 && (
            <div className="card">
              <div className="card-title"><User size={17} /> Profile Settings</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-700), var(--blue-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 800 }}>
                  {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{profile.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Vendor Account · Demo Mode</div>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization</label>
                  <input className="form-input" value={profile.org} onChange={e => setProfile(p => ({ ...p, org: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={saveProfile}>
                <Save size={14} /> Save Profile
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 1 && (
            <div className="card">
              <div className="card-title"><Bell size={17} /> Notification Preferences</div>
              {[
                { key: 'email',     label: 'Email Notifications',    sub: 'Receive updates via email' },
                { key: 'compliance',label: 'Compliance Alerts',       sub: 'Alerts when compliance issues are detected' },
                { key: 'deadline',  label: 'Deadline Reminders',      sub: 'Reminders before tender due dates' },
                { key: 'weekly',    label: 'Weekly Summary Report',   sub: 'Weekly digest of your bid activity' },
              ].map(n => (
                <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{n.sub}</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                    <input type="checkbox" checked={notifications[n.key]} onChange={e => setNotifications(p => ({ ...p, [n.key]: e.target.checked }))} style={{ display: 'none' }} />
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 12,
                      background: notifications[n.key] ? 'var(--blue-900)' : 'var(--gray-300)',
                      transition: 'background 0.2s'
                    }}>
                      <div style={{
                        position: 'absolute', top: 2, left: notifications[n.key] ? 22 : 2,
                        width: 20, height: 20, borderRadius: '50%', background: 'white',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                  </label>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={saveNotifications}>
                <Save size={14} /> Save Preferences
              </button>
            </div>
          )}

          {/* Security */}
          {activeSection === 2 && (
            <div className="card">
              <div className="card-title"><Lock size={17} /> Security Settings</div>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
              </div>
              <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={savePassword}>
                <Lock size={14} /> Change Password
              </button>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Add an extra layer of security to your account</div>
                </div>
                <span className="badge badge-gray">Coming Soon</span>
              </div>
            </div>
          )}

          {/* Application */}
          {activeSection === 3 && (
            <div className="card">
              <div className="card-title"><Monitor size={17} /> Application Settings</div>
              <div className="form-group">
                <label className="form-label">Theme</label>
                <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)}>
                  <option value="light">Light (Default)</option>
                  <option value="dark">Dark (Coming Soon)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select">
                  <option>English (Default)</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date Format</label>
                <select className="form-select">
                  <option>DD MMM YYYY (Indian Standard)</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="alert alert-info">
                <span>🔒</span>
                <div style={{ fontSize: 12.5 }}>
                  <strong>Demo Mode Active.</strong> Application settings are illustrative for the SIH prototype.
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => toast.success('Settings saved!')}>
                <Save size={14} /> Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
