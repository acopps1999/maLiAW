import { Routes, Route, Navigate } from 'react-router-dom'
import ValentineGate from './pages/ValentineGate'
import Dashboard from './pages/Dashboard'
import SetEditor from './pages/SetEditor'
import StudyMode from './pages/StudyMode'

function App() {
  const hasAcceptedValentine = localStorage.getItem('valentineAccepted') === 'true'

  return (
    <Routes>
      <Route
        path="/"
        element={hasAcceptedValentine ? <Navigate to="/dashboard" replace /> : <ValentineGate />}
      />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sets/new" element={<SetEditor />} />
      <Route path="/sets/:id/edit" element={<SetEditor />} />
      <Route path="/sets/:id/study" element={<StudyMode />} />
    </Routes>
  )
}

export default App
