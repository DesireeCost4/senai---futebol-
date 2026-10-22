import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { CalendarDays, CircleHelp, Eye, X } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import DuelsDialog from '../components/DuelsDialog';
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
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<ClubeLiga[]>([]);
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ homeClubId?: string; awayClubId?: string }>({});
  const [result, setResult] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState('');
  const [matchesReloadKey, setMatchesReloadKey] = useState(0);
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null);
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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMatches() {
      setMatchesLoading(true);
      setMatchesError('');
      try {
        const response = await ligaService.listarPartidas();
        if (!cancelled) setMatches(response);
      } catch (requestError) {
        if (!cancelled) {
          setMatches([]);
          setMatchesError(mensagemErro(requestError));
        }
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    }
    void loadMatches();
    return () => {
      cancelled = true;
    };
  }, [result, matchesReloadKey]);

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
      setShowNewMatch(false);
      navigate(`/matches/${response.id}`);
    } catch (requestError) {
      setError(mensagemErro(requestError));
    } finally {
      playInProgress.current = false;
      setPlaying(false);
    }

  }

  async function openMatch(match: Match) {
    navigate(`/matches/${match.id}`);
  }

  return (
    <main className="matches-page">
      <header className="matches-page__header">
        <span>
          <CalendarDays size={20} />
        </span>
        <div>
          <div>Competição · Liga</div>
          <h1>Partidas</h1>
          <p>Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico.</p>
        </div>
        <button type="button" className="play-match-button matches-new-button" onClick={() => setShowNewMatch(true)}>
          + &nbsp; Nova partida
        </button>
      </header>

      {!matchesLoading && !matchesError && matches[0] && (
        <section className="latest-match-card" aria-label="Última partida">
          <span className="latest-match-card__label">Última partida</span>
          <div className="latest-match-card__teams">
            <strong>{matches[0].home.club_name}<small>Mandante</small></strong>
            <span className="latest-match-card__club">{matches[0].home.club_name.slice(0, 3).toUpperCase()}</span>
            <b>{matches[0].home.goals} × {matches[0].away.goals}</b>
            <span className="latest-match-card__club">{matches[0].away.club_name.slice(0, 3).toUpperCase()}</span>
            <strong>{matches[0].away.club_name}<small>Visitante</small></strong>
          </div>
          <button type="button" className="view-duels-button" onClick={() => void openMatch(matches[0])} disabled={loadingMatchId === matches[0].id}>
            {loadingMatchId === matches[0].id ? 'Carregando...' : 'Ver duelos'} <Eye size={13} />
          </button>
        </section>
      )}
      <section className="match-history-inline" aria-labelledby="match-history-inline-title">
        <header>
          <div>
            <h2 id="match-history-inline-title">Histórico de partidas</h2>
            <p>Da mais recente para a mais antiga.</p>
          </div>
          <select aria-label="Filtrar partidas por clube">
            <option>Clube: todos</option>
          </select>
        </header>
        <div className="match-history-inline__table">
          {!matchesLoading && !matchesError && matches.slice(0, 8).map((match) => (
            <div className="match-history-inline__row" key={match.id}>
              <span>{new Date(match.played_at).toLocaleDateString('pt-BR')} &nbsp; {new Date(match.played_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <strong>{match.home.club_name}</strong>
              <b>{match.home.goals} × {match.away.goals}</b>
              <strong>{match.away.club_name}</strong>
              <button type="button" onClick={() => void openMatch(match)} disabled={loadingMatchId === match.id}>
                {loadingMatchId === match.id ? 'Carregando...' : 'Ver duelos'} <Eye size={12} />
              </button>
            </div>
          ))}
          {matchesLoading && (
            <LoadingState
              skeleton
              title="Carregando partidas"
              description="Carregando..."
            />
          )}
          {!matchesLoading && matchesError && (
            <ErrorState
              title="Não foi possível carregar as partidas"
              description="Não foi possível carregar os dados. Verifique a conexão e tente de novo."
              onRetry={() => setMatchesReloadKey((current) => current + 1)}
            />
          )}
          {!matchesLoading && !matchesError && !matches.length && (
            <EmptyState
              title="Nenhuma partida jogada"
              description="Escale os 5 titulares de dois clubes e jogue a primeira partida. O resultado aparece aqui e na classificação."
              actionLabel="＋  Nova partida"
              onAction={() => setShowNewMatch(true)}
            />
          )}
        </div>
        <small className="matches-footnote">{matches.length} {matches.length === 1 ? 'partida' : 'partidas'}</small>
      </section>

      {showNewMatch && <div className="match-modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !playing) setShowNewMatch(false);
      }}>
      <section className="match-create-panel match-create-modal" aria-labelledby="match-create-title">
        <button type="button" className="match-modal-close" onClick={() => setShowNewMatch(false)} disabled={playing}><X size={15} /></button>
        <header>
          <h2 id="match-create-title">Nova partida</h2>
          <p>O resultado e os duelos serão retornados pela API.</p>
        </header>
        {error && (
          <div className="match-error" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <LoadingState message="Carregando clubes..." />
        ) : clubs.length === 0 ? (
          <EmptyState message="Cadastre clubes antes de disputar partidas." />
        ) : (
          <div className="match-selectors">
            <label>
              <span>
                Mandante <b>*</b>
              </span>
              <select
                id="home-club"
                value={homeClubId}
                aria-invalid={Boolean(fieldErrors.homeClubId)}
                aria-describedby={fieldErrors.homeClubId ? 'home-club-error' : undefined}
                onChange={(event) => {
                  setHomeClubId(event.target.value);
                  setFieldErrors((current) => ({ ...current, homeClubId: undefined }));
                }}
                disabled={playing}
              >
                <option value="">Selecione o mandante</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym})
                  </option>
                ))}
              </select>
              {fieldErrors.homeClubId && (
                <small className="match-field-error" id="home-club-error">
                  {fieldErrors.homeClubId}
                </small>
              )}
            </label>
            <span className="match-versus">×</span>
            <label>
              <span>
                Visitante <b>*</b>
              </span>
              <select
                id="away-club"
                value={awayClubId}
                aria-invalid={Boolean(fieldErrors.awayClubId)}
                aria-describedby={fieldErrors.awayClubId ? 'away-club-error' : undefined}
                onChange={(event) => {
                  setAwayClubId(event.target.value);
                  setFieldErrors((current) => ({ ...current, awayClubId: undefined }));
                }}
                disabled={playing}
              >
                <option value="">Selecione o visitante</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym})
                  </option>
                ))}
              </select>
              {fieldErrors.awayClubId && (
                <small className="match-field-error" id="away-club-error">
                  {fieldErrors.awayClubId}
                </small>
              )}
            </label>
          </div>
        )}
        <div className="match-rules">
          <strong>ⓘ &nbsp; Como sai o placar</strong>
          <p>Cada time faz 3 ataques. Pela ordem do elenco, os jogadores de linha vão do 1º ao 5º ataque. O goleiro defende o gol. O vencedor é quem fizer mais gols. Os dois clubes precisam ter os 5 titulares escalados.</p>
        </div>
        <footer className="match-create-panel__footer">
          <p>
            <CircleHelp size={14} />
            Clubes sem escalação completa receberão a mensagem da API.
          </p>
          <button
            type="button"
            className="play-match-button"
            onClick={() => void playMatch()}
            disabled={loading || playing || clubs.length === 0}
          >
            {playing ? <span className="match-spinner" /> : <CalendarDays size={15} />}
            {playing ? 'Jogando...' : 'Jogar partida'}
          </button>
        </footer>
      </section>
      </div>}

      {result && <DuelsDialog match={result} onClose={() => setResult(null)} />}
    </main>
  );
}
