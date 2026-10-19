import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import TransactionResultDialog from '../components/TransactionResultDialog';
import { clubeService } from '../services/clubeService';
import { jogadorService } from '../services/jogadorService';
import { mercadoService } from '../services/mercadoService';
import {
  brasiliaDateTimeInputToIso,
  formatCurrency,
  formatDateTimeLocalBrasilia,
} from '../utils/formatters';
import type { CompraResultado } from '../types/transactions';
import './MercadoJogadoresPage.css';

type JogadorLivre = {
  id: number;
  name: string;
  position: string;
  overall: number;
  age: number;
  condition: string;
  market_value: number | string;
};

type ClubeOption = {
  id: number;
  name: string;
  acronym: string;
};

type PaginaJogadores = {
  data: JogadorLivre[];
  meta: { page: number; total_items: number; total_pages: number };
};

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível concluir a compra.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível concluir a compra.';
}

export default function MercadoJogadoresPage() {
  const [jogadores, setJogadores] = useState<JogadorLivre[]>([]);
  const [clubes, setClubes] = useState<ClubeOption[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [jogadorCompra, setJogadorCompra] = useState<JogadorLivre | null>(null);
  const [clubeId, setClubeId] = useState('');
  const [fidelidadeAte, setFidelidadeAte] = useState(() =>
    formatDateTimeLocalBrasilia(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  );
  const [errosCampos, setErrosCampos] = useState<{ clubId?: string; loyaltyUntil?: string }>({});
  const [erroCompra, setErroCompra] = useState('');
  const [comprando, setComprando] = useState(false);
  const [resultado, setResultado] = useState<CompraResultado | null>(null);
  const compraEmCurso = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function carregarDados() {
      setCarregando(true);
      setErro('');
      try {
        const [paginaJogadores, listaClubes] = await Promise.all([
          jogadorService.listarJogadores({
            free: true,
            search: busca.trim() || undefined,
            page: pagina,
            limit: 10,
          }) as Promise<PaginaJogadores>,
          clubeService.listarClubes('name') as Promise<ClubeOption[]>,
        ]);
        if (!cancelled) {
          setJogadores(paginaJogadores.data ?? []);
          setTotal(paginaJogadores.meta?.total_items ?? 0);
          setTotalPaginas(paginaJogadores.meta?.total_pages ?? 0);
          setClubes(listaClubes);
        }
      } catch (requestError) {
        if (!cancelled) setErro(mensagemErro(requestError));
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    void carregarDados();
    return () => {
      cancelled = true;
    };
  }, [busca, pagina, reloadKey]);

  function validarCompra(): boolean {
    const errors: { clubId?: string; loyaltyUntil?: string } = {};
    if (!clubeId) errors.clubId = 'Selecione o clube comprador.';
    if (!fidelidadeAte) errors.loyaltyUntil = 'Informe o fim da fidelidade.';
    else if (!brasiliaDateTimeInputToIso(fidelidadeAte))
      errors.loyaltyUntil = 'Informe uma data e hora válidas.';
    setErrosCampos(errors);
    return Object.keys(errors).length === 0;
  }

  async function confirmarCompra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (compraEmCurso.current || !jogadorCompra || !validarCompra()) return;

    const loyaltyUntil = brasiliaDateTimeInputToIso(fidelidadeAte);
    if (!loyaltyUntil) return;

    compraEmCurso.current = true;
    setComprando(true);
    setErroCompra('');
    try {
      const resposta = (await mercadoService.comprarJogador(jogadorCompra.id, {
        clubId: Number(clubeId),
        loyaltyUntil,
      })) as CompraResultado;
      setResultado(resposta);
      setJogadorCompra(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroCompra(mensagemErro(requestError));
    } finally {
      compraEmCurso.current = false;
      setComprando(false);
    }
  }

  function abrirCompra(jogador: JogadorLivre) {
    setJogadorCompra(jogador);
    setClubeId('');
    setFidelidadeAte(formatDateTimeLocalBrasilia(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    setErrosCampos({});
    setErroCompra('');
  }

  return (
    <main className="market-players-page">
      <Link className="market-players-back" to="/clubs">
        <ArrowLeft size={15} />
        Voltar para clubes
      </Link>
      <header className="market-players-header">
        <span className="market-players-header__icon">
          <ShoppingCart size={19} />
        </span>
        <div>
          <div className="market-players-header__eyebrow">Mercado de transferências</div>
          <h1>Jogadores livres</h1>
          <p>Escolha um atleta, o clube comprador e o prazo de fidelidade.</p>
        </div>
      </header>

      <section className="market-players-panel" aria-labelledby="free-players-title">
        <header className="market-players-toolbar">
          <div>
            <h2 id="free-players-title">Disponíveis para compra</h2>
            <p>{total} jogadores livres</p>
          </div>
          <label className="market-players-search">
            <Search size={15} />
            <span className="sr-only">Buscar jogador livre</span>
            <input
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
              placeholder="Buscar jogador..."
            />
          </label>
        </header>

        <div
          className="market-players-table-scroll"
          role="region"
          aria-label="Jogadores disponíveis para compra"
          tabIndex={0}
        >
          <table className="market-players-table">
            <thead>
              <tr>
                <th scope="col">Jogador</th>
                <th scope="col">Posição</th>
                <th scope="col">Global</th>
                <th scope="col">Idade</th>
                <th scope="col">Condição</th>
                <th scope="col" className="market-players-table__money">
                  Valor de mercado
                </th>
                <th scope="col" className="market-players-table__action">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {!carregando &&
                !erro &&
                jogadores.map((jogador) => (
                  <tr key={jogador.id}>
                    <td>
                      <strong>{jogador.name}</strong>
                      <small>#{jogador.id}</small>
                    </td>
                    <td>
                      <span className="market-position">{jogador.position}</span>
                    </td>
                    <td>{jogador.overall}</td>
                    <td>{jogador.age}</td>
                    <td>
                      {jogador.condition === 'APTO'
                        ? 'Apto'
                        : jogador.condition === 'DOENTE'
                          ? 'Doente'
                          : 'Mal condicionado'}
                    </td>
                    <td className="market-players-table__money">
                      {formatCurrency(jogador.market_value)}
                    </td>
                    <td className="market-players-table__action">
                      <button
                        className="market-buy-button"
                        type="button"
                        disabled={Boolean(jogadorCompra) || comprando}
                        onClick={() => abrirCompra(jogador)}
                      >
                        <ShoppingCart size={14} />
                        Comprar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {carregando && <LoadingState message="Carregando jogadores livres..." />}
          {!carregando && erro && (
            <ErrorState message={erro} onRetry={() => setReloadKey((current) => current + 1)} />
          )}
          {!carregando && !erro && jogadores.length === 0 && (
            <EmptyState message="Nenhum jogador livre encontrado." />
          )}
        </div>

        <footer className="market-players-footer">
          <span>
            {total === 0
              ? 'Nenhum resultado'
              : `Página ${pagina} de ${Math.max(totalPaginas, 1)} · ${total} jogadores`}
          </span>
          <div>
            <button
              type="button"
              aria-label="Página anterior"
              disabled={carregando || pagina <= 1}
              onClick={() => setPagina((current) => Math.max(1, current - 1))}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima página"
              disabled={carregando || pagina >= totalPaginas}
              onClick={() => setPagina((current) => Math.min(totalPaginas, current + 1))}
            >
              ›
            </button>
          </div>
        </footer>
      </section>

      {jogadorCompra && (
        <div
          className="market-buy-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !comprando) setJogadorCompra(null);
          }}
        >
          <section
            className="market-buy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-buy-title"
          >
            <button
              className="market-buy-dialog__close"
              type="button"
              aria-label="Fechar compra"
              disabled={comprando}
              onClick={() => setJogadorCompra(null)}
            >
              ×
            </button>
            <span className="market-buy-dialog__icon">
              <ShoppingCart size={18} />
            </span>
            <h2 id="market-buy-title">Comprar jogador</h2>
            <p className="market-buy-dialog__player">
              {jogadorCompra.name} · {jogadorCompra.position} ·{' '}
              {formatCurrency(jogadorCompra.market_value)}
            </p>
            <form onSubmit={confirmarCompra} noValidate>
              {erroCompra && (
                <div className="market-buy-error" role="alert">
                  {erroCompra}
                </div>
              )}
              <label className="market-buy-field" htmlFor="buyer-club">
                <span>
                  Clube comprador <b>*</b>
                </span>
                <select
                  id="buyer-club"
                  value={clubeId}
                  onChange={(event) => {
                    setClubeId(event.target.value);
                    setErrosCampos((current) => ({ ...current, clubId: undefined }));
                  }}
                  aria-invalid={Boolean(errosCampos.clubId)}
                >
                  <option value="">Selecione um clube</option>
                  {clubes.map((clube) => (
                    <option key={clube.id} value={clube.id}>
                      {clube.name} ({clube.acronym})
                    </option>
                  ))}
                </select>
                {errosCampos.clubId && <small>{errosCampos.clubId}</small>}
              </label>
              <label className="market-buy-field" htmlFor="loyalty-until">
                <span>
                  Fim da fidelidade <b>*</b>
                </span>
                <input
                  id="loyalty-until"
                  type="datetime-local"
                  value={fidelidadeAte}
                  onChange={(event) => {
                    setFidelidadeAte(event.target.value);
                    setErrosCampos((current) => ({ ...current, loyaltyUntil: undefined }));
                  }}
                  aria-invalid={Boolean(errosCampos.loyaltyUntil)}
                />
                <small className={errosCampos.loyaltyUntil ? 'market-buy-field__error' : ''}>
                  {errosCampos.loyaltyUntil || 'Horário interpretado como Brasília (UTC−3).'}
                </small>
              </label>
              <footer className="market-buy-dialog__actions">
                <button
                  type="button"
                  className="market-buy-cancel"
                  disabled={comprando}
                  onClick={() => setJogadorCompra(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="market-buy-confirm" disabled={comprando}>
                  {comprando ? <span className="market-spinner" /> : <ShoppingCart size={15} />}
                  {comprando ? 'Enviando...' : 'Confirmar compra'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {resultado && (
        <TransactionResultDialog result={resultado} onClose={() => setResultado(null)} />
      )}
    </main>
  );
}
