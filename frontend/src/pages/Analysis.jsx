import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CheckCircle, Loader, ArrowRight } from 'lucide-react'

const STEPS = [
  { num: 1, key: 'upload', label: 'Upload Tender Documents' },
  { num: 2, key: 'extract', label: 'AI Extracts & Classifies' },
  { num: 3, key: 'verify', label: 'Verify with Government Portals' },
  { num: 4, key: 'compliance', label: 'Compliance Analysis' },
  { num: 5, key: 'risk', label: 'Risk Assessment' },
]

export default function Analysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [tender, setTender] = useState(null)
  const [done, setDone] = useState(false)
  const [log, setLog] = useState([])

  const addLog = (msg) => setLog(prev => [...prev, { msg, time: new Date().toLocaleTimeString() }])

  useEffect(() => {
    runAnalysis()
  }, [id])

  const runAnalysis = async () => {
    try {
      // Step 1 – fetch tender info
      setCurrentStep(1)
      addLog('Fetching tender information…')
      const tRes = await api.get(`/api/tenders/${id}`)
      setTender(tRes.data)
      await delay(600)

      // Step 2 – AI extraction
      setCurrentStep(2)
      addLog('AI is extracting and classifying documents…')
      await api.post(`/api/tenders/${id}/analyze`)
      await delay(800)
      addLog('Documents classified. GSTIN, PAN, company info extracted.')

      // Step 3 – Government verification
      setCurrentStep(3)
      addLog('Verifying with GSTN, Income Tax, MCA, GeM portals…')
      await api.post(`/api/tenders/${id}/verify`)
      await delay(700)
      addLog('Government portal verification complete.')

      // Step 4 – Compliance
      setCurrentStep(4)
      addLog('Running compliance rule engine…')
      await api.get(`/api/tenders/${id}/compliance`)
      await delay(500)
      addLog('Compliance checklist generated.')

      // Step 5 – Risk
      setCurrentStep(5)
      addLog('Calculating risk score…')
      await api.get(`/api/tenders/${id}/risk`)
      await delay(400)
      addLog('Risk assessment complete.')

      setDone(true)
      toast.success('Analysis complete!')
    } catch (err) {
      toast.error('Analysis failed: ' + (err.response?.data?.detail || err.message))
    }
  }

  const delay = (ms) => new Promise(r => setTimeout(r, ms))

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>AI Document Analysis</h1>
        <p>ComplyAI is extracting, classifying and verifying your tender documents.</p>
      </div>

      {/* Step progress */}
      <div className="steps-bar" style={{ marginBottom: 28 }}>
        {STEPS.map(s => (
          <div
            key={s.num}
            className={`step-item${s.num < currentStep ? ' completed' : s.num === currentStep ? ' active' : ''}`}
          >
            <div className="step-circle">
              {s.num < currentStep ? <CheckCircle size={16} /> : s.num}
            </div>
            <div className="step-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tender info extracted */}
      {tender && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">📄 Tender Information Extracted</div>
          <div className="grid-2" style={{ gap: 12 }}>
            {[
              ['Tender ID', tender.gem_tender_id],
              ['Tender Title', tender.title],
              ['Department', tender.department],
              ['Bid Value', tender.bid_value ? `₹${Number(tender.bid_value).toLocaleString('en-IN')}` : '—'],
              ['Due Date', tender.due_date || '—'],
              ['Status', tender.status?.toUpperCase()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{k}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log output */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          {done ? <CheckCircle size={17} style={{ color: 'var(--green-600)' }} /> : <Loader size={17} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
          {done ? 'Analysis Complete' : 'Processing…'}
        </div>
        <div style={{ background: 'var(--gray-900)', borderRadius: 8, padding: '14px 18px', fontFamily: 'monospace', fontSize: 12.5 }}>
          {log.map((l, i) => (
            <div key={i} style={{ color: i === log.length - 1 ? '#86efac' : '#9ca3af', marginBottom: 4 }}>
              <span style={{ color: '#6b7280' }}>[{l.time}]</span> {l.msg}
            </div>
          ))}
          {!done && (
            <div style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#60a5fa', borderColor: 'rgba(96,165,250,0.2)' }} />
              Processing…
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      {done && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(`/tenders/${id}/results`)}>
            View Analysis Results <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/tenders/${id}/compliance`)}>
            Go to Compliance Check
          </button>
        </div>
      )}
    </div>
  )
}
