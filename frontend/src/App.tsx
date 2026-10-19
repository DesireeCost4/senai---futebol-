import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ClubesPage from './pages/ClubesPage';
import ClubeDetalhesPage from './pages/ClubeDetalhesPage';
import MercadoJogadoresPage from './pages/MercadoJogadoresPage';
import EscalacaoPage from './pages/EscalacaoPage';
import PartidasPage from './pages/PartidasPage';
import HistoricoPartidasPage from './pages/HistoricoPartidasPage';
import ClassificacaoPage from './pages/ClassificacaoPage';
import './App.css';

export default function App() {
  return (
    <AppShell>
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
    </AppShell>
  );
}
