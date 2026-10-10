import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UploadTender from './pages/UploadTender'
import Analysis from './pages/Analysis'
import AnalysisResults from './pages/AnalysisResults'
import ComplianceCheck from './pages/ComplianceCheck'
import Verification from './pages/Verification'
import MyBids from './pages/MyBids'
import Reports from './pages/Reports'
import AuditTrail from './pages/AuditTrail'
import Settings from './pages/Settings'
import HelpSupport from './pages/HelpSupport'
import { AuthProvider, useAuth } from './hooks/useAuth'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<UploadTender />} />
            <Route path="tenders/:id/analysis" element={<Analysis />} />
            <Route path="tenders/:id/results" element={<AnalysisResults />} />
            <Route path="tenders/:id/compliance" element={<ComplianceCheck />} />
            <Route path="tenders/:id/verification" element={<Verification />} />
            <Route path="bids" element={<MyBids />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-trail" element={<AuditTrail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<HelpSupport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
