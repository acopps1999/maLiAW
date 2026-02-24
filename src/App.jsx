import { Routes, Route, Navigate } from 'react-router-dom'
import ValentineGate from './pages/ValentineGate'
import Dashboard from './pages/Dashboard'
import SetEditor from './pages/SetEditor'
import StudyMode from './pages/StudyMode'
import WriteMode from './pages/WriteMode'
import MatchMode from './pages/MatchMode'

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
      <Route path="/sets/:id/write" element={<WriteMode />} />
      <Route path="/sets/:id/match" element={<MatchMode />} />
    </Routes>
  )
}

export default App
