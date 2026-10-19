import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AlertTriangle, Building2, ShoppingCart, X } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import ClubTabs from '../components/ClubTabs';
import TransactionResultDialog from '../components/TransactionResultDialog';
import { clubeService } from '../services/clubeService';
import { mercadoService } from '../services/mercadoService';
import { transacaoService } from '../services/transacaoService';
import { formatCurrency, formatDateTimeBrasilia } from '../utils/formatters';
import type {
  HistoricoTransacoes,
  TipoTransacao,
  Transacao,
  TransacoesSummary,
  VendaResultado,
} from '../types/transactions';
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

type JogadorHistorico = {
  id: number;
  name: string;
};

type AbaClube = 'elenco' | 'historico';

const resumoVazio: TransacoesSummary = {
  total_spent: 0,
  total_received: 0,
  total_fees: 0,
  total_penalties: 0,
  total_profit: 0,
};

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Não foi possível carregar os detalhes do clube.'
    );
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [clube, setClube] = useState<ClubeDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [jogadorVenda, setJogadorVenda] = useState<JogadorDoClube | null>(null);
  const [erroVenda, setErroVenda] = useState('');
  const [vendendo, setVendendo] = useState(false);
  const [resultadoVenda, setResultadoVenda] = useState<VendaResultado | null>(null);
  const vendaEmCurso = useRef(false);
  const [historico, setHistorico] = useState<Transacao[]>([]);
  const [summary, setSummary] = useState<TransacoesSummary>(resumoVazio);
  const [historicoCarregando, setHistoricoCarregando] = useState(true);
  const [historicoErro, setHistoricoErro] = useState('');
  const [jogadoresHistorico, setJogadoresHistorico] = useState<JogadorHistorico[]>([]);
  const [tiposSelecionados, setTiposSelecionados] = useState<TipoTransacao[]>([]);
  const [jogadorHistoricoId, setJogadorHistoricoId] = useState('');
  const [historicoReloadKey, setHistoricoReloadKey] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [erroExportacao, setErroExportacao] = useState('');
  const exportInProgress = useRef(false);
  const abaAtiva: AbaClube = searchParams.get('tab') === 'history' ? 'historico' : 'elenco';

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

  useEffect(() => {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) return undefined;
    let cancelled = false;

    async function carregarOpcoesJogador() {
      try {
        const resultado = await transacaoService.listarPorClube(Number(id));
        if (cancelled) return;
        const unicos = new Map<number, JogadorHistorico>();
        resultado.data.forEach((transacao) => {
          unicos.set(transacao.player_id, { id: transacao.player_id, name: transacao.player_name });
        });
        setJogadoresHistorico(
          [...unicos.values()].sort((first, second) =>
            first.name.localeCompare(second.name, 'pt-BR'),
          ),
        );
      } catch {
        if (!cancelled) setJogadoresHistorico([]);
      }
    }

    void carregarOpcoesJogador();
    return () => {
      cancelled = true;
    };
  }, [id, historicoReloadKey]);

  useEffect(() => {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) return undefined;
    let cancelled = false;

    async function carregarHistorico() {
      setHistoricoCarregando(true);
      setHistoricoErro('');
      setHistorico([]);
      setSummary(resumoVazio);
      try {
        const resultado: HistoricoTransacoes = await transacaoService.listarPorClube(Number(id), {
          types: tiposSelecionados,
          playerId: jogadorHistoricoId ? Number(jogadorHistoricoId) : undefined,
        });
        if (!cancelled) {
          setHistorico(resultado.data ?? []);
          setSummary(resultado.summary ?? resumoVazio);
        }
      } catch (requestError) {
        if (!cancelled) setHistoricoErro(mensagemErro(requestError));
      } finally {
        if (!cancelled) setHistoricoCarregando(false);
      }
    }

    void carregarHistorico();
    return () => {
      cancelled = true;
    };
  }, [id, tiposSelecionados, jogadorHistoricoId, historicoReloadKey]);

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
      setHistoricoReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroVenda(mensagemErro(requestError));
    } finally {
      vendaEmCurso.current = false;
      setVendendo(false);
    }
  }

  function alternarTipo(tipo: TipoTransacao) {
    setTiposSelecionados((current) =>
      current.includes(tipo) ? current.filter((selected) => selected !== tipo) : [...current, tipo],
    );
  }

  function limparFiltrosHistorico() {
    setTiposSelecionados([]);
    setJogadorHistoricoId('');
  }

  async function exportarHistorico() {
    if (!id || exportInProgress.current) return;
    exportInProgress.current = true;
    setExportando(true);
    setErroExportacao('');
    try {
      const arquivo = await transacaoService.exportarCsv(Number(id), {
        types: tiposSelecionados,
        playerId: jogadorHistoricoId ? Number(jogadorHistoricoId) : undefined,
      });
      const url = URL.createObjectURL(arquivo.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = arquivo.filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      const responseData = isAxiosError(requestError) ? requestError.response?.data : undefined;
      if (responseData instanceof Blob) {
        try {
          const body = JSON.parse(await responseData.text()) as { message?: string };
          setErroExportacao(body.message || 'Não foi possível exportar o histórico.');
        } catch {
          setErroExportacao('Não foi possível exportar o histórico.');
        }
      } else {
        setErroExportacao(mensagemErro(requestError));
      }
    } finally {
      exportInProgress.current = false;
      setExportando(false);
    }
  }

  return (
    <main className="club-detail-page">
      {carregando && <LoadingState message="Carregando detalhes do clube..." />}
      {!carregando && erro && (
        <ErrorState message={erro} onRetry={() => setReloadKey((current) => current + 1)} />
      )}

      {!carregando && !erro && clube && (
        <>
          <header className="club-detail-header">
            <span className="club-detail-header__icon">
              <Building2 size={21} />
            </span>
            <div>
              <div className="club-detail-header__eyebrow">Detalhes do clube</div>
              <h1>
                {clube.name} <span>{clube.acronym}</span>
              </h1>
              <p>Elenco e situação financeira atualizados pela API.</p>
            </div>
            <Link className="club-detail-market-link" to="/players">
              <ShoppingCart size={15} />
              Comprar jogador livre
            </Link>
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
            <article className="club-summary__item club-summary__item--squad-count">
              <span>Elenco</span>
              <strong>{clube.players?.length ?? 0} <small>de 12</small></strong>
              <small>Limite da liga</small>
            </article>
          </section>

          <ClubTabs
            clubId={clube.id}
            active={abaAtiva === 'historico' ? 'history' : 'elenco'}
            squadCount={clube.players?.length ?? 0}
            historyCount={historico.length}
          />

          {abaAtiva === 'elenco' && <section className="club-squad-panel" aria-labelledby="club-squad-title">
            <header className="club-squad-panel__header">
              <div>
                <h2 id="club-squad-title">Elenco</h2>
                <p>{clube.players?.length ?? 0} jogadores · ordem por posição e nome</p>
              </div>
            </header>
            <div
              className="club-squad-table-wrap"
              role="region"
              aria-label="Elenco e contratos"
              tabIndex={0}
            >
              <table className="club-squad-table">
                <thead>
                  <tr>
                    <th scope="col">Jogador</th>
                    <th scope="col">Posição</th>
                    <th scope="col">Global</th>
                    <th scope="col">Idade</th>
                    <th scope="col">Condição</th>
                    <th scope="col" className="club-squad-table__money">
                      Valor de mercado
                    </th>
                    <th scope="col">Fim da fidelidade</th>
                    <th scope="col" className="club-squad-table__number">
                      Dias restantes
                    </th>
                    <th scope="col" className="club-squad-table__number">
                      Multa agora
                    </th>
                    <th scope="col" className="club-squad-table__action">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clube.players?.map((jogador) => (
                    <tr key={jogador.id}>
                      <td>
                        <strong>{jogador.name}</strong>
                        <small>#{jogador.id}</small>
                      </td>
                      <td>
                        <span className="club-position">{jogador.position}</span>
                      </td>
                      <td className="club-squad-table__number">{jogador.overall}</td>
                      <td className="club-squad-table__number">{jogador.age}</td>
                      <td>
                        <span
                          className={`club-condition club-condition--${jogador.condition.toLowerCase()}`}
                        >
                          {conditionLabel(jogador.condition)}
                        </span>
                      </td>
                      <td className="club-squad-table__money">
                        {formatCurrency(jogador.market_value)}
                      </td>
                      <td>
                        {jogador.contract?.loyalty_until
                          ? formatDateTimeBrasilia(jogador.contract.loyalty_until)
                          : '—'}
                      </td>
                      <td className="club-squad-table__number">
                        {jogador.contract?.remaining_days ?? '—'}
                      </td>
                      <td className="club-squad-table__number">
                        {jogador.contract ? `${jogador.contract.penalty_rate}%` : '—'}
                      </td>
                      <td className="club-squad-table__action">
                        <button
                          type="button"
                          className="club-sell-button"
                          disabled={Boolean(jogadorVenda) || vendendo}
                          onClick={() => {
                            setJogadorVenda(jogador);
                            setErroVenda('');
                          }}
                        >
                          Vender
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!clube.players?.length && (
                <EmptyState message="Este clube ainda não tem jogadores no elenco." />
              )}
            </div>
          </section>}

          {abaAtiva === 'historico' && <section className="transactions-panel" aria-labelledby="transactions-title">
            <header className="transactions-panel__header">
              <div>
                <h2 id="transactions-title">Histórico de transações</h2>
                <p>Compras e vendas do clube, em ordem da mais recente.</p>
              </div>
              <button
                type="button"
                className="transactions-export"
                onClick={() => void exportarHistorico()}
                disabled={exportando || historicoCarregando}
              >
                {exportando ? (
                  <span className="transactions-spinner" />
                ) : (
                  <span aria-hidden="true">↓</span>
                )}
                {exportando ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </header>

            <div className="transactions-filters">
              <fieldset className="transactions-type-filter">
                <legend>Tipo</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={tiposSelecionados.includes('COMPRA')}
                    onChange={() => alternarTipo('COMPRA')}
                  />
                  Compra
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={tiposSelecionados.includes('VENDA')}
                    onChange={() => alternarTipo('VENDA')}
                  />
                  Venda
                </label>
              </fieldset>
              <label className="transactions-player-filter">
                <span>Jogador</span>
                <select
                  value={jogadorHistoricoId}
                  onChange={(event) => setJogadorHistoricoId(event.target.value)}
                >
                  <option value="">Todos os jogadores</option>
                  {jogadoresHistorico.map((jogador) => (
                    <option key={jogador.id} value={jogador.id}>
                      {jogador.name}
                    </option>
                  ))}
                </select>
              </label>
              {(tiposSelecionados.length > 0 || jogadorHistoricoId) && (
                <button
                  type="button"
                  className="transactions-clear-filter"
                  onClick={limparFiltrosHistorico}
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {erroExportacao && (
              <div className="transactions-inline-error" role="alert">
                {erroExportacao}
              </div>
            )}
            {historicoErro && (
              <div className="transactions-inline-error" role="alert">
                {historicoErro}
              </div>
            )}

            <div
              className="transactions-table-wrap"
              role="region"
              aria-label="Tabela de transações"
              tabIndex={0}
            >
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th scope="col">Data e hora</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Jogador</th>
                    <th scope="col" className="transactions-table__money">
                      Valor
                    </th>
                    <th scope="col" className="transactions-table__money">
                      Taxa / comissão
                    </th>
                    <th scope="col" className="transactions-table__money">
                      Multa
                    </th>
                    <th scope="col" className="transactions-table__money">
                      Lucro
                    </th>
                    <th scope="col" className="transactions-table__money">
                      Variação da caixa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!historicoCarregando &&
                    !historicoErro &&
                    historico.map((transacao) => {
                      const variacao = Number(transacao.cash_change);
                      const sinal = variacao < 0 ? '-' : '+';
                      return (
                        <tr key={transacao.id}>
                          <td>{formatDateTimeBrasilia(transacao.created_at)}</td>
                          <td>
                            <span
                              className={`transaction-type transaction-type--${transacao.type.toLowerCase()}`}
                            >
                              {transacao.type === 'COMPRA' ? 'Compra' : 'Venda'}
                            </span>
                          </td>
                          <td>{transacao.player_name}</td>
                          <td className="transactions-table__money">
                            {formatCurrency(transacao.value)}
                          </td>
                          <td className="transactions-table__money">
                            {formatCurrency(transacao.fee)}
                          </td>
                          <td className="transactions-table__money">
                            {formatCurrency(transacao.penalty)}
                          </td>
                          <td className="transactions-table__money">
                            {formatCurrency(transacao.profit)}
                          </td>
                          <td
                            className={`transactions-table__money transactions-cash-change ${variacao < 0 ? 'transactions-cash-change--out' : 'transactions-cash-change--in'}`}
                          >
                            {sinal} {formatCurrency(Math.abs(variacao))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {historicoCarregando && <LoadingState message="Carregando transações..." />}
              {!historicoCarregando && !historicoErro && historico.length === 0 && (
                <EmptyState message="Nenhuma transação corresponde aos filtros." />
              )}
            </div>

            <section
              className="transactions-summary"
              aria-label="Resumo financeiro das transações filtradas"
            >
              <h3>Resumo financeiro</h3>
              <div className="transactions-summary__grid">
                <article>
                  <span>Total pago em compras</span>
                  <strong>{formatCurrency(summary.total_spent)}</strong>
                </article>
                <article>
                  <span>Total recebido em vendas</span>
                  <strong>{formatCurrency(summary.total_received)}</strong>
                </article>
                <article>
                  <span>Taxas e comissões</span>
                  <strong>{formatCurrency(summary.total_fees)}</strong>
                </article>
                <article>
                  <span>Multas</span>
                  <strong>{formatCurrency(summary.total_penalties)}</strong>
                </article>
                <article className="transactions-summary__profit">
                  <span>Lucro total</span>
                  <strong>{formatCurrency(summary.total_profit)}</strong>
                </article>
              </div>
            </section>
          </section>}
        </>
      )}

      {jogadorVenda && (
        <div
          className="club-sell-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !vendendo) setJogadorVenda(null);
          }}
        >
          <section
            className="club-sell-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="club-sell-title"
          >
            <button
              type="button"
              className="club-sell-dialog__close"
              aria-label="Fechar confirmação"
              disabled={vendendo}
              onClick={() => setJogadorVenda(null)}
            >
              <X size={16} />
            </button>
            <span className="club-sell-dialog__icon">
              <AlertTriangle size={18} />
            </span>
            <h2 id="club-sell-title">Confirmar venda</h2>
            <p>
              Vender <strong>{jogadorVenda.name}</strong>? A venda encerra o contrato e o jogador
              ficará livre.
            </p>
            {erroVenda && (
              <div className="club-sell-dialog__error" role="alert">
                {erroVenda}
              </div>
            )}
            <footer>
              <button
                type="button"
                className="club-sell-cancel"
                disabled={vendendo}
                onClick={() => setJogadorVenda(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="club-sell-confirm"
                disabled={vendendo}
                onClick={() => void confirmarVenda()}
              >
                {vendendo ? <span className="club-sell-spinner" /> : null}
                {vendendo ? 'Enviando...' : 'Confirmar venda'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {resultadoVenda && (
        <TransactionResultDialog result={resultadoVenda} onClose={() => setResultadoVenda(null)} />
      )}
    </main>
  );
}
