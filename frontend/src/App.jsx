import { Navigate, Route, Routes } from 'react-router-dom'
import ClubesPage from './pages/ClubesPage.tsx'
import ClubeDetalhesPage from './pages/ClubeDetalhesPage.tsx'
import MercadoJogadoresPage from './pages/MercadoJogadoresPage.tsx'
import EscalacaoPage from './pages/EscalacaoPage.tsx'
import PartidasPage from './pages/PartidasPage.tsx'
import HistoricoPartidasPage from './pages/HistoricoPartidasPage.tsx'
import ClassificacaoPage from './pages/ClassificacaoPage.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/clubs" element={<ClubesPage />} />
      <Route path="/clubs/:id" element={<ClubeDetalhesPage />} />
      <Route path="/clubs/:id/lineup" element={<EscalacaoPage />} />
      <Route path="/players" element={<MercadoJogadoresPage />} />
      <Route path="/matches" element={<PartidasPage />} />
      <Route path="/matches/history" element={<HistoricoPartidasPage />} />
      <Route path="/standings" element={<ClassificacaoPage />} />
      <Route path="*" element={<Navigate to="/clubs" replace />} />
    </Routes>
  )
}

export default App
