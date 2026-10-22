import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Check, ChevronDown, Plus, Shield, SlidersHorizontal, X } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
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
  { value: 'name', label: 'Nome' },
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
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [errosCampos, setErrosCampos] = useState<{ name?: string; acronym?: string; checkbox?: string }>({});
  const [erroCriacao, setErroCriacao] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);
  const createInProgress = useRef(false);
  const navigate = useNavigate();

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
    const novosErros: { name?: string; acronym?: string; checkbox?: string } = {};
    const nomeLimpo = nome.trim();
    const siglaLimpa = sigla.trim();

    if (!nomeLimpo) novosErros.name = 'Informe o nome do clube.';
    else if (nomeLimpo.length < 3 || nomeLimpo.length > 60)
      novosErros.name = 'O nome deve ter entre 3 e 60 caracteres.';

    if (!siglaLimpa) novosErros.acronym = 'Informe a sigla do clube.';
    else if (!/^[A-Z]{3}$/.test(siglaLimpa))
      novosErros.acronym = 'A sigla deve ter exatamente 3 letras maiúsculas.';

    if (!checkboxChecked) novosErros.checkbox = 'Você deve confirmar que o clube começa com 300,00 em caixa e sem jogadores.';

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function criarClube(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createInProgress.current || !validarFormulario()) return;

    createInProgress.current = true;
    setSalvando(true);
    setErroCriacao('');
    setSucesso('');
    try {
      const clubeCriado = await clubeService.criarClube({ name: nome.trim(), acronym: sigla.trim() });
      setFormularioAberto(false);
      setNome('');
      setSigla('');
      setCheckboxChecked(false);
      setErrosCampos({});
      navigate(`/clubs/${clubeCriado.id}`, { state: { clubeCriado: true } });
    } catch (requestError) {
      setErroCriacao(mensagemErro(requestError));
    } finally {
      createInProgress.current = false;
      setSalvando(false);
    }
  }

  function fecharFormulario() {
    if (salvando) return;
    setFormularioAberto(false);
    setErroCriacao('');
    setErrosCampos({});
    setCheckboxChecked(false);
  }

  return (
    <main className="clubs-page">
      <header className="clubs-page__header">
        <div className="clubs-page__title-row">
          <span className="clubs-page__icon">
            <Shield size={19} />
          </span>
          <div>
            <h1>Clubes</h1>
            <p>Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20 clubes.</p>
          </div>
          <button className="clubs-create-button" type="button" onClick={() => {
            setFormularioAberto(true);
            setSucesso('');
          }}>
            <Plus size={15} /> Novo clube
          </button>
        </div>
      </header>

      <section className="clubs-panel" aria-labelledby="clubs-list-title">
        <div className="clubs-panel__toolbar">
          <div className="clubs-count">
            <strong id="clubs-list-title">{clubes.length} clubes</strong>
            <span>{clubes.length} de 20</span>
          </div>
          <div className="clubs-toolbar__actions">
            <label className="clubs-sort">
              <SlidersHorizontal size={14} />
              <span>Ordenar:</span>
              <select
                value={ordenacao}
                onChange={(event) => setOrdenacao(event.target.value as OrdenacaoClubes)}
                disabled={carregando}
              >
                {ordenacoes.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          </div>
        </div>

        <div
          className="clubs-table-scroll"
          role="region"
          aria-label="Tabela de clubes"
          tabIndex={0}
        >
          <table className="clubs-table">
            <thead>
              <tr>
                <th scope="col">Clube</th>
                <th scope="col">Sigla</th>
                <th scope="col" className="clubs-table__money">
                  Caixa
                </th>
                <th scope="col" className="clubs-table__money">
                  Valor do elenco
                </th>
                <th scope="col" className="clubs-table__money">
                  Patrimônio
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {!carregando &&
                !erro &&
                clubes.map((clube, index) => (
                  <tr key={clube.id}>
                    <td>
                      <span
                        className={`clubs-table__avatar clubs-table__avatar--${index % 5}`}
                        aria-hidden="true"
                      >
                        {clube.acronym.slice(0, 1)}
                      </span>
                      <Link className="clubs-table__name" to={`/clubs/${clube.id}`}>
                        {clube.name}
                      </Link>
                    </td>
                    <td>
                      <span className="clubs-table__acronym">{clube.acronym}</span>
                    </td>
                    <td className="clubs-table__money">{formatCurrency(clube.cash)}</td>
                    <td className="clubs-table__money">{formatCurrency(clube.squad_value)}</td>
                    <td className="clubs-table__money clubs-table__net-worth">
                      {formatCurrency(clube.net_worth)}
                    </td>
                    <td className="clubs-table__action">
                      <Link to={`/clubs/${clube.id}`}>Ver clube <span aria-hidden="true">›</span></Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {carregando && <LoadingState message="Carregando clubes..." />}
          {!carregando && erro && (
            <ErrorState message={erro} onRetry={() => setReloadKey((current) => current + 1)} />
          )}
          {!carregando && !erro && clubes.length === 0 && (
            <div className="clubs-empty-state">
              <span className="clubs-empty-state__icon"><Shield size={18} /></span>
              <strong>Nenhum clube cadastrado</strong>
              <p>Crie o primeiro clube com nome e sigla. Ele começa com 300,00<br />em caixa e sem jogadores.</p>
              <button type="button" onClick={() => setFormularioAberto(true)}>
                <Plus size={12} /> Novo clube
              </button>
            </div>
          )}
        </div>
        <p className="clubs-page__hint">Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor, com empate desfeito pelo nome.</p>
      </section>
      {sucesso && (
        <div className="clubs-toast clubs-toast--success" role="status">
          <Check size={16} />
          <span>{sucesso}</span>
          <button type="button" onClick={() => setSucesso('')} aria-label="Dispensar mensagem">
            <X size={14} />
          </button>
        </div>
      )}
      {formularioAberto && (
        <div
          className="clubs-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharFormulario();
          }}
        >
          <section
            className="clubs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-club-title"
          >
            <header className="clubs-modal__header">
              <div>
                <h2 id="create-club-title">Novo clube</h2>
                <p>Informe o nome e a sigla do clube.</p>
              </div>
              <button
                type="button"
                className="clubs-modal__close"
                onClick={fecharFormulario}
                disabled={salvando}
                aria-label="Fechar formulário"
              >
                <X size={17} />
              </button>
            </header>
            <form onSubmit={criarClube} noValidate>
              {erroCriacao && (
                <div className="clubs-form__error" role="alert">
                  <strong><AlertCircle size={11} /> Não foi possível criar o clube</strong>
                  <span>{erroCriacao}</span>
                </div>
              )}
              <label className="clubs-field" htmlFor="club-name">
                <span>Nome</span>
                <input
                  id="club-name"
                  value={nome}
                  onChange={(event) => {
                    setNome(event.target.value);
                    setErrosCampos((current) => ({ ...current, name: undefined }));
                  }}
                  maxLength={60}
                  aria-invalid={Boolean(errosCampos.name)}
                  aria-describedby={errosCampos.name ? 'club-name-error' : 'club-name-help'}
                  placeholder="Leões da Serra"
                  autoFocus
                />
                {errosCampos.name ? (
                  <small className="clubs-field__error" id="club-name-error">
                    {errosCampos.name}
                  </small>
                ) : (
                  <small id="club-name-help">De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto.<br />Não pode repetir outro clube.</small>
                )}
              </label>
              <label className="clubs-field" htmlFor="club-acronym">
                <span>Sigla</span>
                <input
                  id="club-acronym"
                  value={sigla}
                  onChange={(event) => {
                    setSigla(event.target.value.toUpperCase().slice(0, 3));
                    setErrosCampos((current) => ({ ...current, acronym: undefined }));
                  }}
                  maxLength={3}
                  aria-invalid={Boolean(errosCampos.acronym)}
                  aria-describedby={
                    errosCampos.acronym ? 'club-acronym-error' : 'club-acronym-help'
                  }
                  placeholder="LDS"
                  autoComplete="off"
                />
                {errosCampos.acronym ? (
                  <small className="clubs-field__error" id="club-acronym-error">
                    {errosCampos.acronym}
                  </small>
                ) : (
                  <small id="club-acronym-help">3 letras de A a Z, maiúsculas, que aparecerão no nome nessa ordem; a primeira é a primeira letra do nome.</small>
                )}
              </label>
              <label className="clubs-checkbox-field">
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  onChange={(event) => {
                    setCheckboxChecked(event.target.checked);
                    setErrosCampos((current) => ({ ...current, checkbox: undefined }));
                  }}
                  aria-invalid={Boolean(errosCampos.checkbox)}
                />
                O clube começa com 300,00 em caixa e sem jogadores.
                {errosCampos.checkbox && (
                  <small className="clubs-field__error">{errosCampos.checkbox}</small>
                )}
              </label>

              <footer className="clubs-modal__actions">
                <button
                  type="button"
                  className="clubs-cancel-button"
                  onClick={fecharFormulario}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button type="submit" className="clubs-submit-button" disabled={salvando}>
                  {salvando ? (
                    <span className="clubs-spinner" aria-hidden="true" />
                  ) : (
                    <Check size={15} />
                  )}
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
