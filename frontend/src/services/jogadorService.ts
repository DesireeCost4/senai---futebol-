import api from './api';
import type {
  CondicaoJogador,
  EdicaoJogador,
  FiltrosJogadores,
  Jogador,
  NovoJogador,
  PaginaJogadores,
} from '../types/players';

function montarParametros(filtros: FiltrosJogadores = {}) {
  const parametros = {
    search: filtros.search,
    position: filtros.position,
    condition: filtros.condition,
    free: filtros.free,
    club_id: filtros.clubId,
    min_age: filtros.minAge,
    max_age: filtros.maxAge,
    min_value: filtros.minValue,
    max_value: filtros.maxValue,
    sort: filtros.sort ?? 'name',
    page: filtros.page ?? 1,
    limit: filtros.limit ?? 10,
  };

  return Object.fromEntries(
    Object.entries(parametros).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}

async function listarJogadores(filtros: FiltrosJogadores = {}): Promise<PaginaJogadores> {
  const response = await api.get<PaginaJogadores>('/players', {
    params: montarParametros(filtros),
  });
  return response.data;
}

async function excluirJogador(id: number): Promise<void> {
  await api.delete(`/players/${id}`);
}

export const jogadorService = {
  listarJogadores,

  async buscarJogadorPorId(id: number): Promise<Jogador> {
    const response = await api.get<Jogador>(`/players/${id}`);
    return response.data;
  },

  async cadastrarJogador(dadosJogador: NovoJogador): Promise<Jogador> {
    const response = await api.post<Jogador>('/players', dadosJogador);
    return response.data;
  },

  async editarJogador(id: number, dadosAtualizados: EdicaoJogador): Promise<Jogador> {
    const response = await api.put<Jogador>(`/players/${id}`, dadosAtualizados);
    return response.data;
  },

  async alterarCondicao(id: number, condition: CondicaoJogador): Promise<Jogador> {
    const response = await api.patch<Jogador>(`/players/${id}/condition`, { condition });
    return response.data;
  },

  excluirJogador,

  async excluirJogadoresLivres(): Promise<{ deletedCount: number }> {
    const primeiraPagina = await listarJogadores({ free: true, page: 1, limit: 50 });
    const ids = new Set(primeiraPagina.data.map((jogador) => jogador.id));
    const totalPaginas = primeiraPagina.meta.total_pages;

    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
      const resultado = await listarJogadores({ free: true, page: pagina, limit: 50 });
      resultado.data.forEach((jogador) => ids.add(jogador.id));
    }

    for (const id of ids) await excluirJogador(id);
    return { deletedCount: ids.size };
  },
};
