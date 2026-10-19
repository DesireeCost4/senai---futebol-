import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { EmptyState, LoadingState } from '../components/RequestState';
import LeagueNavigation from '../components/LeagueNavigation';
import { ligaService } from '../services/ligaService';
import type { Standing } from '../types/league';
import './ClassificacaoPage.css';

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message || error.message || 'Não foi possível carregar a classificação.'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar a classificação.';
}

export default function ClassificacaoPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadStandings() {
      setLoading(true);
      setError('');
      try {
        const response = await ligaService.listarClassificacao();
        if (!cancelled) setStandings(response);
      } catch (requestError) {
        if (!cancelled) setError(mensagemErro(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadStandings();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <main className="standings-page">
      <Link className="standings-page__back" to="/clubs">
        Voltar para clubes
      </Link>
      <LeagueNavigation active="standings" />
      <header className="standings-header">
        <span>
          <Trophy size={20} />
        </span>
        <div>
          <div>Competição · Liga</div>
          <h1>Classificação</h1>
          <p>Tabela oficial da liga.</p>
        </div>
      </header>

      <section className="standings-panel" aria-labelledby="standings-title">
        <header className="standings-panel__header">
          <div>
            <h2 id="standings-title">Tabela de classificação</h2>
            <p>{standings.length} clubes</p>
          </div>
          <button
            type="button"
            className="standings-refresh"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={loading}
            aria-label="Atualizar classificação"
          >
            Atualizar
          </button>
        </header>
        {error && (
          <div className="standings-error" role="alert">
            {error}
          </div>
        )}
        <div
          className="standings-table-wrap"
          role="region"
          aria-label="Classificação da liga"
          tabIndex={0}
        >
          <table className="standings-table">
            <thead>
              <tr>
                <th scope="col">Pos.</th>
                <th scope="col" className="standings-table__club">
                  Clube
                </th>
                <th scope="col">J</th>
                <th scope="col">V</th>
                <th scope="col">E</th>
                <th scope="col">D</th>
                <th scope="col">GM</th>
                <th scope="col">GS</th>
                <th scope="col">SG</th>
                <th scope="col">Pts</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                !error &&
                standings.map((team) => (
                  <tr key={team.club_id}>
                    <td>
                      <span
                        className={
                          team.position <= 4
                            ? 'standings-position standings-position--top'
                            : 'standings-position'
                        }
                      >
                        {team.position}
                      </span>
                    </td>
                    <td className="standings-table__club">
                      <Link to={`/clubs/${team.club_id}`}>{team.club_name}</Link>
                    </td>
                    <td>{team.played}</td>
                    <td>{team.wins}</td>
                    <td>{team.draws}</td>
                    <td>{team.losses}</td>
                    <td>{team.goals_for}</td>
                    <td>{team.goals_against}</td>
                    <td>
                      {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                    </td>
                    <td>
                      <strong className="standings-points">{team.points}</strong>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {loading && <LoadingState message="Carregando classificação..." />}
          {!loading && !error && standings.length === 0 && (
            <EmptyState message="A classificação ainda não tem clubes." />
          )}
        </div>
      </section>
    </main>
  );
}
