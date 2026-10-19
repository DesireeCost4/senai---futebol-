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
  const [fieldErrors, setFieldErrors] = useState<{ homeClubId?: string; awayClubId?: string }>({});
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
    if (playInProgress.current) return;
    const errors: { homeClubId?: string; awayClubId?: string } = {};
    if (!homeClubId) errors.homeClubId = 'Selecione o clube mandante.';
    if (!awayClubId) errors.awayClubId = 'Selecione o clube visitante.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
              <select id="home-club" value={homeClubId} aria-invalid={Boolean(fieldErrors.homeClubId)} aria-describedby={fieldErrors.homeClubId ? 'home-club-error' : undefined} onChange={(event) => { setHomeClubId(event.target.value); setFieldErrors((current) => ({ ...current, homeClubId: undefined })); }} disabled={playing}>
                <option value="">Selecione o mandante</option>
                {clubs.map((club) => <option key={club.id} value={club.id}>{club.name} ({club.acronym})</option>)}
              </select>
              {fieldErrors.homeClubId && <small className="match-field-error" id="home-club-error">{fieldErrors.homeClubId}</small>}
            </label>
            <span className="match-versus">×</span>
            <label>
              <span>Visitante <b>*</b></span>
              <select id="away-club" value={awayClubId} aria-invalid={Boolean(fieldErrors.awayClubId)} aria-describedby={fieldErrors.awayClubId ? 'away-club-error' : undefined} onChange={(event) => { setAwayClubId(event.target.value); setFieldErrors((current) => ({ ...current, awayClubId: undefined })); }} disabled={playing}>
                <option value="">Selecione o visitante</option>
                {clubs.map((club) => <option key={club.id} value={club.id}>{club.name} ({club.acronym})</option>)}
              </select>
              {fieldErrors.awayClubId && <small className="match-field-error" id="away-club-error">{fieldErrors.awayClubId}</small>}
            </label>
          </div>
        )}
        <footer className="match-create-panel__footer">
          <p><CircleHelp size={14} />Clubes sem escalação completa receberão a mensagem da API.</p>
          <button type="button" className="play-match-button" onClick={() => void playMatch()} disabled={loading || playing || clubs.length === 0}>
            {playing ? <span className="match-spinner" /> : <CalendarDays size={15} />}
            {playing ? 'Jogando...' : 'Jogar partida'}
          </button>
        </footer>
      </section>

      {result && <DuelsDialog match={result} onClose={() => setResult(null)} />}
    </main>
  );
}