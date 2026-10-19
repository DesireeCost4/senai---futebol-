import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { Building2, Check, ChevronDown, Plus, RotateCcw, ShoppingCart, X } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import LeagueNavigation from '../components/LeagueNavigation';
import { clubeService } from '../services/clubeService';
import { formatCurrency } from '../utils/formatters';
import './ClubesPage.css';

type Clube = {
  id: number;
  name: string;
  acronym: string;
  cash: number | string;
  squad_value: number | string;
  net_worth: number | string;
};

type OrdenacaoClubes = 'name' | 'net_worth_desc' | 'net_worth_asc';

const ordenacoes: { value: OrdenacaoClubes; label: string }[] = [
  { value: 'name', label: 'Nome (A–Z)' },
  { value: 'net_worth_desc', label: 'Patrimônio (maior primeiro)' },
  { value: 'net_worth_asc', label: 'Patrimônio (menor primeiro)' },
];

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível carregar os clubes.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar os clubes.';
}

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoClubes>('name');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ name?: string; acronym?: string }>({});
  const [erroCriacao, setErroCriacao] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function carregarClubes() {
      setCarregando(true);
      setErro('');
      try {
        const resposta = (await clubeService.listarClubes(ordenacao)) as Clube[];
        if (!cancelled) setClubes(resposta);
      } catch (requestError) {
        if (!cancelled) setErro(mensagemErro(requestError));
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    void carregarClubes();
    return () => {
      cancelled = true;
    };
  }, [ordenacao, reloadKey]);

  function validarFormulario() {
    const novosErros: { name?: string; acronym?: string } = {};
    const nomeLimpo = nome.trim();
    const siglaLimpa = sigla.trim();

    if (!nomeLimpo) novosErros.name = 'Informe o nome do clube.';
    else if (nomeLimpo.length < 3 || nomeLimpo.length > 60) novosErros.name = 'O nome deve ter entre 3 e 60 caracteres.';

    if (!siglaLimpa) novosErros.acronym = 'Informe a sigla do clube.';
    else if (!/^[A-Z]{3}$/.test(siglaLimpa)) novosErros.acronym = 'A sigla deve ter exatamente 3 letras maiúsculas.';

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function criarClube(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando || !validarFormulario()) return;

    setSalvando(true);
    setErroCriacao('');
    setSucesso('');
    try {
      await clubeService.criarClube({ name: nome.trim(), acronym: sigla.trim() });
      setFormularioAberto(false);
      setNome('');
      setSigla('');
      setErrosCampos({});
      setSucesso('Clube criado com sucesso.');
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroCriacao(mensagemErro(requestError));
    } finally {
      setSalvando(false);
    }
  }

  function fecharFormulario() {
    if (salvando) return;
    setFormularioAberto(false);
    setErroCriacao('');
    setErrosCampos({});
  }

  return (
    <main className="clubs-page">
      <header className="clubs-page__header">
        <div className="clubs-page__breadcrumb">Mercado <span>/</span> Clubes</div>
        <div className="clubs-page__title-row">
          <span className="clubs-page__icon"><Building2 size={19} /></span>
          <div>
            <h1>Clubes</h1>
            <p>Visão geral dos clubes da liga e de seus recursos.</p>
          </div>
          <Link className="clubs-market-link" to="/players"><ShoppingCart size={15} />Mercado de jogadores</Link>
        </div>
      </header>

      <LeagueNavigation />

      <section className="clubs-panel" aria-labelledby="clubs-list-title">
        <div className="clubs-panel__toolbar">
          <div>
            <h2 id="clubs-list-title">Todos os clubes</h2>
            <p>{clubes.length} {clubes.length === 1 ? 'clube' : 'clubes'}</p>
          </div>
          <div className="clubs-toolbar__actions">
            <label className="clubs-sort">
              <span>Ordenar por</span>
              <select
                value={ordenacao}
                onChange={(event) => setOrdenacao(event.target.value as OrdenacaoClubes)}
                disabled={carregando}
              >
                {ordenacoes.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
            <button
              type="button"
              className="clubs-refresh"
              onClick={() => setReloadKey((current) => current + 1)}
              disabled={carregando}
              aria-label="Atualizar lista de clubes"
              title="Atualizar lista"
            >
              <RotateCcw size={15} />
            </button>
            <button type="button" className="clubs-create-button" onClick={() => { setFormularioAberto(true); setSucesso(''); }}>
              <Plus size={15} />
              <span>Novo clube</span>
            </button>
          </div>
        </div>

        <div className="clubs-table-scroll" role="region" aria-label="Tabela de clubes" tabIndex={0}>
          <table className="clubs-table">
            <thead>
              <tr>
                <th scope="col">Clube</th>
                <th scope="col">Sigla</th>
                <th scope="col" className="clubs-table__money">Caixa</th>
                <th scope="col" className="clubs-table__money">Valor do elenco</th>
                <th scope="col" className="clubs-table__money">Patrimônio</th>
              </tr>
            </thead>
            <tbody>
              {!carregando && !erro && clubes.map((clube, index) => (
                <tr key={clube.id}>
                  <td>
                    <span className={`clubs-table__avatar clubs-table__avatar--${index % 5}`} aria-hidden="true">
                      {clube.acronym.slice(0, 1)}
                    </span>
                    <Link className="clubs-table__name" to={`/clubs/${clube.id}`}>{clube.name}</Link>
                  </td>
                  <td><span className="clubs-table__acronym">{clube.acronym}</span></td>
                  <td className="clubs-table__money">{formatCurrency(clube.cash)}</td>
                  <td className="clubs-table__money">{formatCurrency(clube.squad_value)}</td>
                  <td className="clubs-table__money clubs-table__net-worth">{formatCurrency(clube.net_worth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {carregando && <LoadingState message="Carregando clubes..." />}
          {!carregando && erro && <ErrorState message={erro} onRetry={() => setReloadKey((current) => current + 1)} />}
          {!carregando && !erro && clubes.length === 0 && <EmptyState message="Ainda não há clubes cadastrados." />}
        </div>
        <footer className="clubs-panel__footer">
          <span>Valores apresentados conforme os dados da API.</span>
          <span>{clubes.length} registros</span>
        </footer>
      </section>
      {sucesso && <div className="clubs-toast clubs-toast--success" role="status"><Check size={16} /><span>{sucesso}</span><button type="button" onClick={() => setSucesso('')} aria-label="Dispensar mensagem"><X size={14} /></button></div>}
      {formularioAberto && (
        <div className="clubs-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) fecharFormulario(); }}>
          <section className="clubs-modal" role="dialog" aria-modal="true" aria-labelledby="create-club-title">
            <header className="clubs-modal__header">
              <div>
                <span className="clubs-modal__icon"><Building2 size={18} /></span>
                <h2 id="create-club-title">Novo clube</h2>
                <p>Cadastre um clube na liga.</p>
              </div>
              <button type="button" className="clubs-modal__close" onClick={fecharFormulario} disabled={salvando} aria-label="Fechar formulário"><X size={17} /></button>
            </header>
            <form onSubmit={criarClube} noValidate>
              {erroCriacao && <div className="clubs-form__error" role="alert">{erroCriacao}</div>}
              <label className="clubs-field" htmlFor="club-name">
                <span>Nome do clube <b>*</b></span>
                <input
                  id="club-name"
                  value={nome}
                  onChange={(event) => { setNome(event.target.value); setErrosCampos((current) => ({ ...current, name: undefined })); }}
                  maxLength={60}
                  aria-invalid={Boolean(errosCampos.name)}
                  aria-describedby={errosCampos.name ? 'club-name-error' : 'club-name-help'}
                  placeholder="Ex.: Clube Atlético Central"
                  autoFocus
                />
                {errosCampos.name ? <small className="clubs-field__error" id="club-name-error">{errosCampos.name}</small> : <small id="club-name-help">De 3 a 60 caracteres.</small>}
              </label>
              <label className="clubs-field" htmlFor="club-acronym">
                <span>Sigla <b>*</b></span>
                <input
                  id="club-acronym"
                  value={sigla}
                  onChange={(event) => { setSigla(event.target.value.toUpperCase().slice(0, 3)); setErrosCampos((current) => ({ ...current, acronym: undefined })); }}
                  maxLength={3}
                  aria-invalid={Boolean(errosCampos.acronym)}
                  aria-describedby={errosCampos.acronym ? 'club-acronym-error' : 'club-acronym-help'}
                  placeholder="CAC"
                  autoComplete="off"
                />
                {errosCampos.acronym ? <small className="clubs-field__error" id="club-acronym-error">{errosCampos.acronym}</small> : <small id="club-acronym-help">Exatamente 3 letras maiúsculas.</small>}
              </label>
              <footer className="clubs-modal__actions">
                <button type="button" className="clubs-cancel-button" onClick={fecharFormulario} disabled={salvando}>Cancelar</button>
                <button type="submit" className="clubs-submit-button" disabled={salvando}>
                  {salvando ? <span className="clubs-spinner" aria-hidden="true" /> : <Check size={15} />}
                  {salvando ? 'Salvando...' : 'Criar clube'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}