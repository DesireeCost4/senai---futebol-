import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { jogadorService } from '../services/jogadorService';

export type OrdenacaoJogadores =
  | 'name'
  | 'value_asc'
  | 'value_desc'
  | 'age_asc'
  | 'age_desc'
  | 'position';

export type FiltrosJogadores = {
  search: string;
  position: string;
  condition: string;
  free: boolean | null;
  clubId: number | null;
  minAge: number | null;
  maxAge: number | null;
  minValue: number | null;
  maxValue: number | null;
};

export type Jogador = {
  id: number;
  name: string;
  position: string;
  overall: number;
  agility: number;
  age: number;
  condition: string;
  base_value: number | string;
  market_value: number | string;
  club_id: number | null;
};

export type PaginaJogadores = {
  data: Jogador[];
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
};

const filtrosIniciais: FiltrosJogadores = {
  search: '',
  position: '',
  condition: '',
  free: null,
  clubId: null,
  minAge: null,
  maxAge: null,
  minValue: null,
  maxValue: null,
};

const pageSize = 10;

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível carregar os jogadores.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível carregar os jogadores.';
}

export function useJogadores() {
  const [filtros, setFiltros] = useState<FiltrosJogadores>(filtrosIniciais);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoJogadores>('name');
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<PaginaJogadores>({
    data: [],
    meta: { page: 1, limit: pageSize, total_items: 0, total_pages: 0 },
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function buscarJogadores() {
      setCarregando(true);
      setErro('');

      try {
        const response = (await jogadorService.listarJogadores({
          search: filtros.search || undefined,
          position: filtros.position || undefined,
          condition: filtros.condition || undefined,
          free: filtros.free ?? undefined,
          clubId: filtros.clubId ?? undefined,
          minAge: filtros.minAge ?? undefined,
          maxAge: filtros.maxAge ?? undefined,
          minValue: filtros.minValue ?? undefined,
          maxValue: filtros.maxValue ?? undefined,
          sort: ordenacao,
          page: pagina,
          limit: pageSize,
        })) as PaginaJogadores;

        if (!cancelled) {
          setResultado({
            data: response.data ?? [],
            meta: response.meta ?? { page: pagina, limit: pageSize, total_items: 0, total_pages: 0 },
          });
        }
      } catch (requestError) {
        if (!cancelled) setErro(getErrorMessage(requestError));
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    void buscarJogadores();
    return () => {
      cancelled = true;
    };
  }, [filtros, ordenacao, pagina, reloadKey]);

  function atualizarFiltro<Key extends keyof FiltrosJogadores>(chave: Key, valor: FiltrosJogadores[Key]) {
    setFiltros((atuais) => ({ ...atuais, [chave]: valor }));
    setPagina(1);
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais);
    setOrdenacao('name');
    setPagina(1);
  }

  function atualizarOrdenacao(valor: OrdenacaoJogadores) {
    setOrdenacao(valor);
    setPagina(1);
  }

  function recarregar() {
    setReloadKey((atual) => atual + 1);
  }

  return {
    jogadores: resultado.data,
    paginacao: resultado.meta,
    filtros,
    ordenacao,
    pagina,
    carregando,
    erro,
    atualizarFiltro,
    atualizarOrdenacao,
    irParaPagina: setPagina,
    limparFiltros,
    recarregar,
  };
}