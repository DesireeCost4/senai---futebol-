import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { CalendarDays, CircleHelp } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import DuelsDialog from '../components/DuelsDialog';
import LeagueNavigation from '../components/LeagueNavigation';
import { ligaService } from '../services/ligaService';
import type { ClubeLiga, Match } from '../types/league';
import './PartidasPage.css';

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível concluir a partida.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível concluir a partida.';
}

export default function PartidasPage() {
  const [clubs, setClubs] = useState<ClubeLiga[]>([]);
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Match | null>(null);
  const playInProgress = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadClubs() {
      setLoading(true);
      try {
        const response = await ligaService.listarClubes();
        if (!cancelled) setClubs(response);
      } catch (requestError) {
        if (!cancelled) setError(mensagemErro(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadClubs();
    return () => { cancelled = true; };
  }, []);

  async function playMatch() {
    if (playInProgress.current || !homeClubId || !awayClubId) return;
    playInProgress.current = true;
    setPlaying(true);
    setError('');
    try {
      const response = await ligaService.jogarPartida(Number(homeClubId), Number(awayClubId));
      setResult(response);
    } catch (requestError) {
      setError(mensagemErro(requestError));
    } finally {
      playInProgress.current = false;
      setPlaying(false);
    }
  }

  return (
    <main className="matches-page">
      <Link className="matches-page__back" to="/clubs">Voltar para clubes</Link>
      <LeagueNavigation active="matches" />
      <header className="matches-page__header">
        <span><CalendarDays size={20} /></span>
        <div>
          <div>Competição · Liga</div>
          <h1>Partidas</h1>
          <p>Escolha os clubes e dispute uma partida da liga.</p>
        </div>
      </header>

      <section className="match-create-panel" aria-labelledby="match-create-title">
        <header>
          <h2 id="match-create-title">Nova partida</h2>
          <p>O resultado e os duelos serão retornados pela API.</p>
        </header>
        {error && <div className="match-error" role="alert">{error}</div>}
        {loading ? <LoadingState message="Carregando clubes..." /> : clubs.length === 0 ? <EmptyState message="Cadastre clubes antes de disputar partidas." /> : (
          <div className="match-selectors">
            <label>
              <span>Mandante <b>*</b></span>
              <select value={homeClubId} onChange={(event) => setHomeClubId(event.target.value)} disabled={playing}>
                <option value="">Selecione o mandante</option>
                {clubs.map((club) => <option key={club.id} value={club.id}>{club.name} ({club.acronym})</option>)}
              </select>
            </label>
            <span className="match-versus">×</span>
            <label>
              <span>Visitante <b>*</b></span>
              <select value={awayClubId} onChange={(event) => setAwayClubId(event.target.value)} disabled={playing}>
                <option value="">Selecione o visitante</option>
                {clubs.map((club) => <option key={club.id} value={club.id}>{club.name} ({club.acronym})</option>)}
              </select>
            </label>
          </div>
        )}
        <footer className="match-create-panel__footer">
          <p><CircleHelp size={14} />Clubes sem escalação completa receberão a mensagem da API.</p>
          <button type="button" className="play-match-button" onClick={() => void playMatch()} disabled={loading || playing || !homeClubId || !awayClubId}>
            {playing ? <span className="match-spinner" /> : <CalendarDays size={15} />}
            {playing ? 'Jogando...' : 'Jogar partida'}
          </button>
        </footer>
      </section>

      {result && <DuelsDialog match={result} onClose={() => setResult(null)} />}
    </main>
  );
}