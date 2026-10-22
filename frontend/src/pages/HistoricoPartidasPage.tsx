import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { CalendarDays, Eye } from 'lucide-react';
import { EmptyState, LoadingState } from '../components/RequestState';
import { ligaService } from '../services/ligaService';
import { formatDateTimeBrasilia } from '../utils/formatters';
import type { ClubeLiga, Match } from '../types/league';
import './HistoricoPartidasPage.css';

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Não foi possível carregar o histórico de partidas.'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar o histórico de partidas.';
}

export default function HistoricoPartidasPage() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<ClubeLiga[]>([]);
  const [clubId, setClubId] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadClubs() {
      try {
        const response = await ligaService.listarClubes();
        if (!cancelled) setClubs(response);
      } catch (requestError) {
        if (!cancelled) setError(mensagemErro(requestError));
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
      setLoading(true);
      setError('');
      try {
        const response = await ligaService.listarPartidas(clubId ? Number(clubId) : undefined);
        if (!cancelled) setMatches(response);
      } catch (requestError) {
        if (!cancelled) setError(mensagemErro(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadMatches();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  async function openMatch(match: Match) {
    navigate(`/matches/${match.id}`);
  }

  return (
    <main className="match-history-page">
      <header className="match-history-header">
        <span>
          <CalendarDays size={20} />
        </span>
        <div>
          <div>Competição · Liga</div>
          <h1>Histórico de partidas</h1>
          <p>Partidas em ordem cronológica, da mais recente à mais antiga.</p>
        </div>
      </header>

      <section className="match-history-panel" aria-labelledby="match-history-title">
        <header className="match-history-panel__header">
          <div>
            <h2 id="match-history-title">Partidas disputadas</h2>
            <p>
              {matches.length} {matches.length === 1 ? 'partida' : 'partidas'}
            </p>
          </div>
          <label className="match-history-filter">
            <span>Filtrar por clube</span>
            <select value={clubId} onChange={(event) => setClubId(event.target.value)}>
              <option value="">Todos os clubes</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        {error && (
          <div className="match-history-error" role="alert">
            {error}
          </div>
        )}
        <div
          className="match-history-table-wrap"
          role="region"
          aria-label="Lista cronológica de partidas"
          tabIndex={0}
        >
          <table className="match-history-table">
            <thead>
              <tr>
                <th scope="col">Data e hora</th>
                <th scope="col" className="match-history-table__home">
                  Mandante
                </th>
                <th scope="col">Placar</th>
                <th scope="col">Visitante</th>
                <th scope="col">Duelos</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                !error &&
                matches.map((match) => (
                  <tr key={match.id}>
                    <td>{formatDateTimeBrasilia(match.played_at)}</td>
                    <td className="match-history-table__home">{match.home.club_name}</td>
                    <td>
                      <strong className="match-score">
                        {match.home.goals} × {match.away.goals}
                      </strong>
                    </td>
                    <td>{match.away.club_name}</td>
                    <td>
                      <button
                        type="button"
                        className="view-duels-button"
                        onClick={() => void openMatch(match)}
                      >
                        <Eye size={14} />
                        Ver duelos
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {loading && <LoadingState message="Carregando partidas..." />}
          {!loading && !error && matches.length === 0 && (
            <EmptyState message="Nenhuma partida encontrada para este filtro." />
          )}
        </div>
      </section>
    </main>
  );
}
