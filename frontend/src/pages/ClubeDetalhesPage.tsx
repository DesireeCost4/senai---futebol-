import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { ArrowLeft, Building2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import { clubeService } from '../services/clubeService';
import { formatCurrency, formatDateTimeBrasilia } from '../utils/formatters';
import './ClubeDetalhesPage.css';

type JogadorDoClube = {
  id: number;
  name: string;
  position: string;
  overall: number;
  age: number;
  condition: string;
  market_value: number | string;
  contract?: {
    purchase_value: number | string;
    loyalty_until: string;
    remaining_days: number;
    penalty_rate: number;
  } | null;
};

type ClubeDetalhe = {
  id: number;
  name: string;
  acronym: string;
  cash: number | string;
  squad_value: number | string;
  net_worth: number | string;
  players: JogadorDoClube[];
};

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível carregar os detalhes do clube.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar os detalhes do clube.';
}

function conditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    APTO: 'Apto',
    MAL_CONDICIONADO: 'Mal condicionado',
    DOENTE: 'Doente',
  };
  return labels[condition] ?? condition;
}

export default function ClubeDetalhesPage() {
  const { id } = useParams();
  const [clube, setClube] = useState<ClubeDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function carregarDetalhes() {
      setCarregando(true);
      setErro('');
      try {
        const resultado = (await clubeService.buscarClubePorId(Number(id))) as ClubeDetalhe;
        if (!cancelled) setClube(resultado);
      } catch (requestError) {
        if (!cancelled) setErro(mensagemErro(requestError));
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    if (id && Number.isInteger(Number(id)) && Number(id) > 0) void carregarDetalhes();
    else {
      setErro('Identificador de clube inválido.');
      setCarregando(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  return (
    <main className="club-detail-page">
      <Link className="club-detail-back" to="/clubs"><ArrowLeft size={15} />Voltar para clubes</Link>

      {carregando && <LoadingState message="Carregando detalhes do clube..." />}
      {!carregando && erro && <ErrorState message={erro} onRetry={() => setReloadKey((current) => current + 1)} />}

      {!carregando && !erro && clube && (
        <>
          <header className="club-detail-header">
            <span className="club-detail-header__icon"><Building2 size={21} /></span>
            <div>
              <div className="club-detail-header__eyebrow">Detalhes do clube</div>
              <h1>{clube.name} <span>{clube.acronym}</span></h1>
              <p>Elenco e situação financeira atualizados pela API.</p>
            </div>
          </header>

          <section className="club-summary" aria-label="Resumo financeiro do clube">
            <article className="club-summary__item">
              <span>Caixa</span>
              <strong>{formatCurrency(clube.cash)}</strong>
            </article>
            <article className="club-summary__item">
              <span>Valor do elenco</span>
              <strong>{formatCurrency(clube.squad_value)}</strong>
            </article>
            <article className="club-summary__item club-summary__item--net-worth">
              <span>Patrimônio</span>
              <strong>{formatCurrency(clube.net_worth)}</strong>
            </article>
          </section>

          <section className="club-squad-panel" aria-labelledby="club-squad-title">
            <header className="club-squad-panel__header">
              <div>
                <h2 id="club-squad-title">Elenco</h2>
                <p>{clube.players?.length ?? 0} jogadores · ordem por posição e nome</p>
              </div>
            </header>
            <div className="club-squad-table-wrap" role="region" aria-label="Elenco e contratos" tabIndex={0}>
              <table className="club-squad-table">
                <thead>
                  <tr>
                    <th scope="col">Jogador</th>
                    <th scope="col">Posição</th>
                    <th scope="col">Global</th>
                    <th scope="col">Idade</th>
                    <th scope="col">Condição</th>
                    <th scope="col" className="club-squad-table__money">Valor de mercado</th>
                    <th scope="col">Fim da fidelidade</th>
                    <th scope="col" className="club-squad-table__number">Dias restantes</th>
                    <th scope="col" className="club-squad-table__number">Multa agora</th>
                  </tr>
                </thead>
                <tbody>
                  {clube.players?.map((jogador) => (
                    <tr key={jogador.id}>
                      <td><strong>{jogador.name}</strong><small>#{jogador.id}</small></td>
                      <td><span className="club-position">{jogador.position}</span></td>
                      <td className="club-squad-table__number">{jogador.overall}</td>
                      <td className="club-squad-table__number">{jogador.age}</td>
                      <td><span className={`club-condition club-condition--${jogador.condition.toLowerCase()}`}>{conditionLabel(jogador.condition)}</span></td>
                      <td className="club-squad-table__money">{formatCurrency(jogador.market_value)}</td>
                      <td>{jogador.contract?.loyalty_until ? formatDateTimeBrasilia(jogador.contract.loyalty_until) : '—'}</td>
                      <td className="club-squad-table__number">{jogador.contract?.remaining_days ?? '—'}</td>
                      <td className="club-squad-table__number">{jogador.contract ? `${jogador.contract.penalty_rate}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!clube.players?.length && <EmptyState message="Este clube ainda não tem jogadores no elenco." />}
            </div>
          </section>
        </>
      )}
    </main>
  );
}