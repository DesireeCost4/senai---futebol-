import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { Trophy, Plus } from 'lucide-react';
import { EmptyState, LoadingState } from '../components/RequestState';
import { ligaService } from '../services/ligaService';
import type { Match, Standing } from '../types/league';
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
  const [matches, setMatches] = useState<Match[]>([]);

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

  useEffect(() => {
    void ligaService
      .listarPartidas()
      .then(setMatches)
      .catch(() => setMatches([]));
  }, [reloadKey]);

  return (
    <main className="standings-page">
      <header className="standings-header">
        <span>
          <Trophy size={20} />
        </span>
        <div>
          <div>Competição · Liga</div>
          <h1>Classificação</h1>
          <p>Todos os clubes, com 3 pontos por vitória e 1 por empate.</p>
        </div>
        <button type="button" className="standings-new-match">
          <Plus size={12} /> Nova partida
        </button>
      </header>

      <div className="standings-layout">
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
                        {team.goal_difference > 0
                          ? `+${team.goal_difference}`
                          : team.goal_difference}
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
          <p className="standings-note">
            J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols
            sofridos · SG: saldo de gols · Pts: pontos
          </p>
        </section>
        <aside className="standings-sidebar">
          <section>
            <h2>Últimas partidas</h2>
            <p>Da mais recente para a mais antiga.</p>
            {matches.slice(0, 2).map((match) => (
              <div className="standings-match" key={match.id}>
                <small>{new Date(match.played_at).toLocaleDateString('pt-BR')}</small>
                <strong>
                  {match.home.club_name}{' '}
                  <b>
                    {match.home.goals} × {match.away.goals}
                  </b>{' '}
                  {match.away.club_name}
                </strong>
              </div>
            ))}
            <a href="/matches">Ver todas as partidas →</a>
          </section>
          <section>
            <h2>Ordem da tabela</h2>
            <p>Critérios de classificação, nesta ordem.</p>
            <ol>
              <li>Mais pontos</li>
              <li>Maior saldo de gols</li>
              <li>Mais gols marcados</li>
              <li>Nome do clube, de A a Z</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
