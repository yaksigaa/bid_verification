import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../services/api'
import {
  Upload, FileText, X, CheckCircle, ArrowRight,
  Shield, AlertCircle
} from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const STEPS = [
  { num: 1, label: 'Upload Tender Documents', active: true },
  { num: 2, label: 'AI Extracts & Classifies' },
  { num: 3, label: 'Verify with Government Portals' },
  { num: 4, label: 'Compliance Analysis' },
]

const SUPPORTED_SOURCES = [
  { icon: '⭐', label: 'GeM Tender Documents' },
  { icon: '📄', label: 'Bid Forms & BOQ' },
  { icon: '📋', label: 'Eligibility Criteria' },
  { icon: '⚙️', label: 'Technical & Financial Requirements' },
  { icon: '📝', label: 'Addendum / Corrigendum' },
]

export default function UploadTender() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedResults, setUploadedResults] = useState([])
  const navigate = useNavigate()

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Only PDF files up to 50 MB are supported.')
      return
    }
    const newFiles = accepted.map(f => ({ file: f, id: Math.random().toString(36).slice(2), status: 'ready' }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  })

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setUploadedResults(prev => prev.filter(r => r.id !== id))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select a PDF file first.')
      return
    }
    setUploading(true)
    const results = []
    for (const item of files) {
      const formData = new FormData()
      formData.append('file', item.file)
      try {
        const res = await api.post('/api/tenders/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        results.push({ id: item.id, ...res.data, status: 'uploaded' })
        toast.success(`${item.file.name} uploaded successfully!`)
      } catch (err) {
        toast.error(`Upload failed: ${err.response?.data?.detail || 'Unknown error'}`)
        results.push({ id: item.id, status: 'failed', filename: item.file.name })
      }
    }
    setUploadedResults(results)
    setUploading(false)
  }

  const proceedToAnalysis = () => {
    const first = uploadedResults.find(r => r.status === 'uploaded')
    if (first?.tender_id) {
      navigate(`/tenders/${first.tender_id}/analysis`)
    } else {
      toast.error('No uploaded tender found. Please upload a PDF first.')
    }
  }

  const anyUploaded = uploadedResults.some(r => r.status === 'uploaded')

  return (
    <div className="page-content-split">
      {/* Main */}
      <div className="page-main">
        <div className="page-header">
          <h1>Upload Tender Documents</h1>
          <p>Upload the tender documents (PDF) to start compliance verification.</p>
        </div>

        {/* Progress Steps */}
        <div className="steps-bar" style={{ marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} className={`step-item${s.active ? ' active' : ''}`}>
              <div className="step-circle">{s.num}</div>
              <div className="step-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div className="card-title">
            <Upload size={17} /> Upload Tender Documents
          </div>

          <div
            {...getRootProps()}
            className={`upload-zone${isDragActive ? ' drag-over' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="upload-icon">
              <Upload size={48} strokeWidth={1.5} />
            </div>
            <div className="upload-title">
              {isDragActive ? 'Drop your PDF here…' : 'Drag & drop tender files here'}
            </div>
            <div className="upload-sub" style={{ marginBottom: 16 }}>or</div>
            <button type="button" className="btn btn-primary">
              Browse Files
            </button>
            <div className="upload-sub" style={{ marginTop: 12 }}>
              Supported format: PDF (Max size: 50 MB)
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 10 }}>
                Uploaded Files ({files.length})
              </div>
              {files.map(item => {
                const result = uploadedResults.find(r => r.id === item.id)
                return (
                  <div key={item.id} className="uploaded-file">
                    <div className="pdf-icon">PDF</div>
                    <div className="file-info">
                      <div className="file-name">{item.file.name}</div>
                      <div className="file-size">{formatBytes(item.file.size)}</div>
                    </div>
                    {result?.status === 'uploaded' && (
                      <div className="file-status">
                        <CheckCircle size={15} />
                        File uploaded successfully
                      </div>
                    )}
                    {result?.status === 'failed' && (
                      <div className="file-status" style={{ color: 'var(--red-600)' }}>
                        <AlertCircle size={15} /> Upload failed
                      </div>
                    )}
                    {!result && (
                      <div className="file-status" style={{ color: 'var(--gray-400)' }}>
                        Ready to upload
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(item.id)}
                      style={{ color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {files.length > 0 && !anyUploaded && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading
                    ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Uploading…</>
                    : <><Upload size={16} /> Upload Files</>
                  }
                </button>
              )}
            </div>
            {anyUploaded && (
              <button
                className="btn btn-success btn-lg"
                onClick={proceedToAnalysis}
                style={{ marginLeft: 'auto' }}
              >
                Proceed to Analysis <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="alert alert-info">
          <Shield size={16} className="alert-icon" />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Before uploading</div>
            <ul style={{ fontSize: 12.5, paddingLeft: 16, lineHeight: 1.7 }}>
              <li>Upload the complete GeM tender document including all sections.</li>
              <li>Ensure the PDF is not password-protected or corrupted.</li>
              <li>Maximum file size: 50 MB per document.</li>
              <li>ComplyAI will extract and classify all requirements automatically.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="page-aside">
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Shield size={16} style={{ color: 'var(--green-600)' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-700)' }}>Your data is secure</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--green-700)' }}>
            We follow Government of India data security guidelines.
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Supported Sources</div>
          {SUPPORTED_SOURCES.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--gray-700)' }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>

        <div className="card" style={{ background: 'var(--yellow-50)', border: '1px solid var(--yellow-100)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--yellow-600)', marginBottom: 6 }}>💡 Tip</div>
          <div style={{ fontSize: 12, color: 'var(--yellow-600)', lineHeight: 1.5 }}>
            Upload the complete tender document including all sections for accurate AI analysis.
          </div>
        </div>
      </div>
    </div>
  )
}
