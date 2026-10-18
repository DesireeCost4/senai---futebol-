import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Building2, ChevronDown, RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import { clubeService } from '../services/clubeService';
import { formatCurrency } from '../utils/formatters';
import './ClubesPage.css';

type Clube = {
  id: number;
  name: string;
  acronym: string;
  cash: number | string;
  squadValue: number | string;
  netWorth: number | string;
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
        </div>
      </header>

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
                    <strong className="clubs-table__name">{clube.name}</strong>
                  </td>
                  <td><span className="clubs-table__acronym">{clube.acronym}</span></td>
                  <td className="clubs-table__money">{formatCurrency(clube.cash)}</td>
                  <td className="clubs-table__money">{formatCurrency(clube.squadValue)}</td>
                  <td className="clubs-table__money clubs-table__net-worth">{formatCurrency(clube.netWorth)}</td>
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
    </main>
  );
}