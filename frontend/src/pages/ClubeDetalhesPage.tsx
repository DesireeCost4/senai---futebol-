import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AlertTriangle, ArrowLeft, Building2, ShoppingCart, X } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import TransactionResultDialog from '../components/TransactionResultDialog';
import { clubeService } from '../services/clubeService';
import { mercadoService } from '../services/mercadoService';
import { formatCurrency, formatDateTimeBrasilia } from '../utils/formatters';
import type { VendaResultado } from '../types/transactions';
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
  const [jogadorVenda, setJogadorVenda] = useState<JogadorDoClube | null>(null);
  const [erroVenda, setErroVenda] = useState('');
  const [vendendo, setVendendo] = useState(false);
  const [resultadoVenda, setResultadoVenda] = useState<VendaResultado | null>(null);
  const vendaEmCurso = useRef(false);

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

  async function confirmarVenda() {
    if (!jogadorVenda || vendaEmCurso.current) return;

    vendaEmCurso.current = true;
    setVendendo(true);
    setErroVenda('');
    try {
      const resultado = (await mercadoService.venderJogador(jogadorVenda.id)) as VendaResultado;
      setResultadoVenda(resultado);
      setJogadorVenda(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroVenda(mensagemErro(requestError));
    } finally {
      vendaEmCurso.current = false;
      setVendendo(false);
    }
  }

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
            <Link className="club-detail-market-link" to="/players"><ShoppingCart size={15} />Comprar jogador livre</Link>
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
                    <th scope="col" className="club-squad-table__action">Ação</th>
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
                      <td className="club-squad-table__action"><button type="button" className="club-sell-button" disabled={Boolean(jogadorVenda) || vendendo} onClick={() => { setJogadorVenda(jogador); setErroVenda(''); }}>Vender</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!clube.players?.length && <EmptyState message="Este clube ainda não tem jogadores no elenco." />}
            </div>
          </section>
        </>
      )}

      {jogadorVenda && (
        <div className="club-sell-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !vendendo) setJogadorVenda(null); }}>
          <section className="club-sell-dialog" role="dialog" aria-modal="true" aria-labelledby="club-sell-title">
            <button type="button" className="club-sell-dialog__close" aria-label="Fechar confirmação" disabled={vendendo} onClick={() => setJogadorVenda(null)}><X size={16} /></button>
            <span className="club-sell-dialog__icon"><AlertTriangle size={18} /></span>
            <h2 id="club-sell-title">Confirmar venda</h2>
            <p>Vender <strong>{jogadorVenda.name}</strong>? A venda encerra o contrato e o jogador ficará livre.</p>
            {erroVenda && <div className="club-sell-dialog__error" role="alert">{erroVenda}</div>}
            <footer>
              <button type="button" className="club-sell-cancel" disabled={vendendo} onClick={() => setJogadorVenda(null)}>Cancelar</button>
              <button type="button" className="club-sell-confirm" disabled={vendendo} onClick={() => void confirmarVenda()}>
                {vendendo ? <span className="club-sell-spinner" /> : null}
                {vendendo ? 'Enviando...' : 'Confirmar venda'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {resultadoVenda && <TransactionResultDialog result={resultadoVenda} onClose={() => setResultadoVenda(null)} />}
    </main>
  );
}