import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AlertTriangle, BadgeDollarSign, Landmark, ShoppingCart, Shirt, WalletCards, X } from 'lucide-react';
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
  const [csvExportado, setCsvExportado] = useState(false);
  const [csvNome, setCsvNome] = useState('');
  const exportInProgress = useRef(false);
  const abaAtiva: AbaClube = searchParams.get('tab') === 'history' ? 'historico' : 'elenco';
  const clubeCriado = Boolean((location.state as { clubeCriado?: boolean } | null)?.clubeCriado);

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
      setCsvNome(arquivo.filename);
      setCsvExportado(true);
      window.setTimeout(() => setCsvExportado(false), 4500);
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
              {clube.acronym.slice(0, 3)}
            </span>
            <div>
              <h1>
                {clube.name} <span>{clube.acronym}</span>
              </h1>
              <div className="club-detail-header__badges">
                <span>Sigla {clube.acronym}</span>
                <span><Shirt size={10} /> {clube.players?.length ?? 0} de 12 jogadores</span>
              </div>
            </div>
            <Link className="club-detail-market-link" to="/players">
              <ShoppingCart size={15} />
              Comprar jogador livre
            </Link>
          </header>

          <section className="club-summary" aria-label="Resumo financeiro do clube">
            <article className="club-summary__item">
              <span>Caixa <WalletCards size={12} /></span>
              <strong>{formatCurrency(clube.cash)}</strong>
              <small>moedas</small>
              <em>Só muda por compras e vendas</em>
            </article>
            <article className="club-summary__item">
              <span>Valor do elenco <BadgeDollarSign size={12} /></span>
              <strong>{formatCurrency(clube.squad_value)}</strong>
              <small>moedas</small>
              <em>Soma dos valores de mercado</em>
            </article>
            <article className="club-summary__item club-summary__item--net-worth">
              <span>Patrimônio <Landmark size={12} /></span>
              <strong>{formatCurrency(clube.net_worth)}</strong>
              <small>moedas</small>
              <em>Caixa + valor do elenco</em>
            </article>
            <article className="club-summary__item club-summary__item--squad-count">
              <span>Elenco <Shirt size={12} /></span>
              <strong>{clube.players?.length ?? 0} <small>de 12</small></strong>
              <em>Limite de 12 jogadores</em>
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
                          <span aria-hidden="true" />
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
                <div className="club-squad-empty">
                  <span className="club-squad-empty__icon"><Shirt size={18} /></span>
                  <strong>Nenhum jogador no elenco</strong>
                  <p>Compre jogadores livres para montar o elenco. O limite é de 12<br />jogadores, e o custo de cada compra não pode passar de 50% do<br />caixa.</p>
                  <Link to="/players"><Shirt size={10} /> Ver jogadores livres</Link>
                </div>
              )}
            </div>
          </section>}

          {abaAtiva === 'historico' && <section className="transactions-panel" aria-labelledby="transactions-title">
            <header className="transactions-panel__header">
              <div>
                <h2 id="transactions-title">Histórico de transações</h2>
                <p>Da mais recente para a mais antiga, com o nome e os valores do momento de cada operação.</p>
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
                <strong>Não foi possível exportar o histórico</strong>
                <span>{erroExportacao}</span>
              </div>
            )}
            {historicoErro && (
              <div
                className={`transactions-inline-error${jogadorHistoricoId ? ' transactions-inline-error--filter' : ''}`}
                role="alert"
              >
                <strong>{jogadorHistoricoId ? 'O filtro foi recusado' : 'Não foi possível carregar o histórico'}</strong>
                <span>{jogadorHistoricoId ? 'Jogador não encontrado.' : historicoErro}</span>
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
                          <td>
                            <span className="transaction-player">
                              <span className={`transaction-player__avatar transaction-player__avatar--${transacao.player_id % 6}`}>
                                {initials(transacao.player_name)}
                              </span>
                              <span>{transacao.player_name}</span>
                            </span>
                          </td>
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
                <div className="transactions-empty">
                  <span className="transactions-empty__icon" aria-hidden="true">↶</span>
                  <strong>Nenhuma transação ainda</strong>
                  <p>As compras e vendas do clube aparecem aqui, com os totais logo abaixo.</p>
                </div>
              )}
            </div>

            <section
              className="transactions-summary"
              aria-label="Resumo financeiro das transações filtradas"
            >
              <div className="transactions-summary__grid">
                <article>
                  <span>🛒 &nbsp;Total pago em compras</span>
                  <strong>{formatCurrency(summary.total_spent)}</strong>
                  <small>Valor + taxa</small>
                </article>
                <article>
                  <span>⌁ &nbsp;Total recebido em vendas</span>
                  <strong>{formatCurrency(summary.total_received)}</strong>
                  <small>Crédito líquido</small>
                </article>
                <article>
                  <span>⊗ &nbsp;Taxas e comissões</span>
                  <strong>{formatCurrency(summary.total_fees)}</strong>
                  <small>Somadas</small>
                </article>
                <article>
                  <span>⚠ &nbsp;Multas</span>
                  <strong>{formatCurrency(summary.total_penalties)}</strong>
                  <small>Por fidelidade</small>
                </article>
                <article className="transactions-summary__profit">
                  <span>⌁ &nbsp;Lucro total</span>
                  <strong>{formatCurrency(summary.total_profit)}</strong>
                  <small>Soma dos lucros, com sinal</small>
                </article>
              </div>
              <p className="transactions-summary__note">
                {historico.length
                  ? `Os totais respeitam os filtros. ${jogadorHistoricoId ? 'Os valores consideram apenas o jogador selecionado.' : 'A soma das variações é o caixa atual.'}`
                  : 'Sem transações, os totais ficam zerados. O botão Exportar CSV continua disponível e baixa só a linha de cabeçalho.'}
              </p>
            </section>
          </section>}
        </>
      )}
      {clubeCriado && clube && (
        <div className="club-created-toast" role="status">
          <span className="club-created-toast__check">✓</span>
          <div><strong>Clube criado</strong><span>{clube.name} ({clube.acronym}) começa com<br />300,00 em caixa.</span></div>
          <Link to="/clubs" state={null} aria-label="Fechar">×</Link>
        </div>
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
            <h2 id="club-sell-title">
              {erroVenda ? 'Venda recusada' : `Vender ${jogadorVenda.name}?`}
            </h2>
            <p className="club-sell-dialog__subtitle">
              O jogador sai do elenco do {clube?.name} e volta a ficar livre.
            </p>
            {!erroVenda && (
              <div className="club-sell-dialog__warning">
                <AlertTriangle size={14} />
                <span>
                  <strong>{jogadorVenda.name} é titular</strong>
                  <small>
                    Ao vender, ele sai da escalação, e o {clube?.name} só volta a jogar partidas
                    depois de escalar de novo os 5 titulares.
                  </small>
                </span>
              </div>
            )}
            {erroVenda && (
              <div className="club-sell-dialog__error" role="alert">
                <strong>A venda foi recusada</strong>
                <span>{erroVenda}</span>
              </div>
            )}
            <div className="club-sell-dialog__player">
              <span className="club-sell-dialog__avatar" aria-hidden="true">
                {initials(jogadorVenda.name)}
              </span>
              <span>
                <strong>{jogadorVenda.name}</strong>
                <small>
                  {jogadorVenda.position} · {jogadorVenda.age} anos
                </small>
              </span>
              <span className="club-sell-dialog__market-value">
                <small>Valor de mercado</small>
                <strong>{formatCurrency(jogadorVenda.market_value)}</strong>
              </span>
            </div>
            <dl className="club-sell-dialog__details">
              <div>
                <dt>Valor de compra</dt>
                <dd>{formatCurrency(jogadorVenda.contract?.purchase_value ?? 0)}</dd>
              </div>
              <div>
                <dt>Fim da fidelidade</dt>
                <dd>
                  {jogadorVenda.contract?.loyalty_until
                    ? formatDateTimeBrasilia(jogadorVenda.contract.loyalty_until)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Dias restantes</dt>
                <dd>{jogadorVenda.contract?.remaining_days ?? 0}</dd>
              </div>
              <div>
                <dt>% de multa se vender agora</dt>
                <dd>
                  <span className="club-sell-dialog__rate">
                    {jogadorVenda.contract?.penalty_rate ?? 0}%
                  </span>
                </dd>
              </div>
            </dl>
            <p className="club-sell-dialog__hint">
              A venda é pelo valor de mercado do momento. Multa (teto de 10,00), lucro, comissão e
              crédito são calculados ao confirmar.
            </p>
            {vendendo && (
              <p className="club-sell-dialog__sending" role="status">
                <span className="club-sell-spinner" />
                Enviando a venda. Os botões ficam desabilitados até a resposta.
              </p>
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
                {vendendo ? 'Vendendo...' : 'Confirmar venda'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {resultadoVenda && (
        <TransactionResultDialog result={resultadoVenda} onClose={() => setResultadoVenda(null)} />
      )}
      {csvExportado && (
        <div className="transactions-export-toast" role="status">
          <strong>✓ &nbsp;CSV baixado</strong>
          <span>{csvNome}, com os filtros da tela aplicados.</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => setCsvExportado(false)}>×</button>
        </div>
      )}
    </main>
  );
}
