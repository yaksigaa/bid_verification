import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Shield, CheckCircle, FileText, BarChart2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('vendor@complyai.demo')
  const [password, setPassword] = useState('demo123')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome to ComplyAI!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials. Use demo credentials.')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async () => {
    setEmail('vendor@complyai.demo')
    setPassword('demo123')
    setLoading(true)
    try {
      await login('vendor@complyai.demo', 'demo123')
      toast.success('Logged in as Demo Vendor!')
      navigate('/')
    } catch {
      toast.error('Demo login failed. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left Hero */}
      <div className="login-left">
        <div>
          <div className="hero-badge">
            <span>🏆</span> Smart India Hackathon 2024 Prototype
          </div>
          <h1 className="hero-title">
            AI-Powered<br />
            Bid Compliance<br />
            Verification
          </h1>
          <p className="hero-sub">
            ComplyAI automates GeM procurement compliance — upload tender documents,
            verify instantly with government portals, and bid with confidence.
          </p>

          <div className="feature-list">
            {[
              { icon: FileText, text: 'AI Document Extraction & Classification' },
              { icon: CheckCircle, text: 'Real-time Government Portal Verification' },
              { icon: BarChart2, text: 'Dynamic Compliance Scoring & Risk Assessment' },
              { icon: Shield, text: 'Complete Audit Trail & Compliance Reports' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="feature-item">
                <div className="feature-icon"><Icon size={16} /></div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7, fontSize: 13 }}>
          <span>🏛️</span>
          <span>Government of India | GeM Integration Reference | DEMO MODE</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="login-right">
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 18 }}>CA</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue-900)' }}>ComplyAI</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>by BidNirva</div>
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>Sign in to your account</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Access your bid compliance dashboard</p>
        </div>

        {/* Demo credentials notice */}
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <Shield size={16} className="alert-icon" />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Demo Credentials Pre-filled</div>
            <div style={{ fontSize: 12 }}>Email: vendor@complyai.demo | Password: demo123</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vendor@complyai.demo"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer'
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--gray-600)' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--blue-600)' }} />
              Remember me
            </label>
            <span style={{ fontSize: 13, color: 'var(--blue-600)', cursor: 'pointer' }}>Forgot password?</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '16px 0', color: 'var(--gray-400)', fontSize: 12 }}>or</div>

        <button
          onClick={demoLogin}
          className="btn btn-secondary w-full"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '11px 18px' }}
        >
          🎯 Continue as Demo Vendor
        </button>

        <div style={{ marginTop: 32, padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Demo Mode Active</div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5 }}>
            All verifications are mock simulations. No real government APIs are accessed.
            Safe for SIH demonstration.
          </div>
        </div>
      </div>
    </div>
  )
}
