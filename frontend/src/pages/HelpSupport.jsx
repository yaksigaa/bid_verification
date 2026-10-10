import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, BookOpen, Bug, ExternalLink } from 'lucide-react'

const FAQS = [
  {
    q: 'What documents can I upload?',
    a: 'ComplyAI supports PDF documents up to 50 MB. This includes GeM tender documents, bid forms, BOQs, eligibility criteria documents, technical and financial requirements, and addendums or corrigendums.'
  },
  {
    q: 'How is the compliance score calculated?',
    a: 'The compliance score is calculated as: (Number of Compliant Requirements / Total Applicable Requirements) × 100. Documents marked as "Not Applicable" are excluded from the calculation. The score updates automatically when you upload missing documents.'
  },
  {
    q: 'How does government portal verification work?',
    a: 'ComplyAI verifies your credentials against GSTN, Income Tax, MCA, GeM, and Udyam portals. In this prototype, all verifications are mock simulations (DEMO MODE). The architecture is designed to connect to real authorized government APIs in production.'
  },
  {
    q: 'What is the Risk Score?',
    a: 'The risk score (0–100) measures the probability of bid rejection. It is calculated based on missing documents (+20 pts each), needs-attention items (+5 pts), verification failures (+25 pts), expired certificates (+15 pts), and blacklist status (+50 pts). Low: 0–25 | Medium: 26–50 | High: 51–75 | Critical: 76–100.'
  },
  {
    q: 'How are my documents protected?',
    a: 'All uploaded documents are stored securely on the server. We follow Government of India data security guidelines. Uploaded files are accessible only to authenticated users. In this prototype, files are stored locally. Production deployment would use encrypted cloud storage.'
  },
  {
    q: 'Can I edit the extracted information?',
    a: 'Yes. After AI extraction, you can review and edit any extracted field in the Analysis Results page. This allows you to correct any extraction errors before proceeding to compliance check.'
  },
  {
    q: 'What tender types does ComplyAI support?',
    a: 'Currently supports IT/hardware tenders (laptops, computers, networking), stationery tenders, and general government procurement tenders. The rule engine is configurable to add new tender types without code changes.'
  },
]

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: open ? 'var(--blue-50)' : 'white',
          border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s'
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: open ? 'var(--blue-800)' : 'var(--gray-800)' }}>
          {faq.q}
        </span>
        {open ? <ChevronUp size={16} style={{ color: 'var(--blue-700)', flexShrink: 0 }} />
               : <ChevronDown size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '12px 16px 16px', background: 'var(--blue-50)', borderTop: '1px solid var(--blue-100)', fontSize: 13.5, color: 'var(--gray-700)', lineHeight: 1.6 }}>
          {faq.a}
        </div>
      )}
    </div>
  )
}

export default function HelpSupport() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Help & Support</h1>
        <p style={{ color: 'var(--gray-500)' }}>Get help with ComplyAI and find answers to common questions.</p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
        {/* Quick links */}
        {[
          { icon: BookOpen, title: 'Documentation', sub: 'Complete guide to using ComplyAI', color: 'var(--blue-900)', bg: 'var(--blue-50)' },
          { icon: MessageSquare, title: 'Contact Support', sub: 'Get help from our team', color: 'var(--green-600)', bg: 'var(--green-50)' },
          { icon: Bug, title: 'Report an Issue', sub: 'Found a bug? Let us know', color: '#d97706', bg: 'var(--yellow-50)' },
          { icon: ExternalLink, title: 'GeM Portal', sub: 'Access the GeM marketplace', color: 'var(--blue-700)', bg: 'var(--blue-50)' },
        ].map(c => (
          <div key={c.title}
            className="card card-hover"
            style={{ cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', padding: '18px 20px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>
              <c.icon size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><HelpCircle size={17} /> Frequently Asked Questions</div>
        {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
      </div>

      {/* Contact form */}
      <div className="card">
        <div className="card-title"><MessageSquare size={17} /> Send us a Message</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input className="form-input" placeholder="Full name" defaultValue="Surya K" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="your@email.com" defaultValue="vendor@complyai.demo" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input className="form-input" placeholder="Brief description of your issue" />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-input" rows={4} placeholder="Describe your issue or question in detail…" style={{ resize: 'vertical' }} />
        </div>
        <button className="btn btn-primary">
          <MessageSquare size={14} /> Send Message
        </button>
        <div style={{ marginTop: 16, padding: 12, background: 'var(--gray-50)', borderRadius: 8, fontSize: 12.5, color: 'var(--gray-500)' }}>
          📧 For SIH prototype inquiries: <strong>team@bidnirva.ai</strong> | Response time: 24–48 hours
        </div>
      </div>
    </div>
  )
}
