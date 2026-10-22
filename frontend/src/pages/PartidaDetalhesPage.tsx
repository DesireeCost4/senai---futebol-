import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { LoadingState } from '../components/RequestState';
import { ligaService } from '../services/ligaService';
import type { Match } from '../types/league';
import DuelsField from '../components/DuelsField';
import './PartidaDetalhesPage.css';

function messageFromError(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível carregar a partida.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar a partida.';
}

export default function PartidaDetalhesPage() {
  const { id } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadMatch() {
      if (!id) return;
      setLoading(true);
      try {
        const response = await ligaService.buscarPartida(Number(id));
        if (!cancelled) setMatch(response);
      } catch (requestError) {
        if (!cancelled) setError(messageFromError(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadMatch();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading)
    return (
      <main className="match-detail-page">
        <LoadingState message="Carregando partida..." />
      </main>
    );
  if (error || !match) {
    return (
      <main className="match-detail-page">
        <Link className="match-detail-back" to="/matches">
          <ArrowLeft size={13} /> Voltar para partidas
        </Link>
        <div className="match-detail-error" role="alert">
          {error || 'Partida não encontrada.'}
        </div>
      </main>
    );
  }

  return (
    <main className="match-detail-page">
      <Link className="match-detail-back" to="/matches">
        <ArrowLeft size={13} /> Voltar para partidas
      </Link>
      <section className="match-detail-score">
        <div>
          <strong>{match.home.club_name}</strong>
          <small>Mandante · {match.home.formation}</small>
        </div>
        <span className="match-detail-score__club">
          {match.home.club_name.slice(0, 3).toUpperCase()}
        </span>
        <b>
          {match.home.goals} × {match.away.goals}
        </b>
        <span className="match-detail-score__club">
          {match.away.club_name.slice(0, 3).toUpperCase()}
        </span>
        <div>
          <strong>{match.away.club_name}</strong>
          <small>Visitante · {match.away.formation}</small>
        </div>
      </section>
      <p className="match-detail-date">
        <CalendarDays size={12} /> Partida #{match.id} ·{' '}
        {new Date(match.played_at).toLocaleString('pt-BR')}
      </p>
      <DuelsField match={match} />
    </main>
  );
}
