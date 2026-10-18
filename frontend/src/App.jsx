import { Navigate, Route, Routes } from 'react-router-dom'
import ClubesPage from './pages/ClubesPage.tsx'
import ClubeDetalhesPage from './pages/ClubeDetalhesPage.tsx'
import MercadoJogadoresPage from './pages/MercadoJogadoresPage.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/clubs" element={<ClubesPage />} />
      <Route path="/clubs/:id" element={<ClubeDetalhesPage />} />
      <Route path="/players" element={<MercadoJogadoresPage />} />
      <Route path="*" element={<Navigate to="/clubs" replace />} />
    </Routes>
  )
}

export default App
