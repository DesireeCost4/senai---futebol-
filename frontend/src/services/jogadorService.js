import api from './api';

/**
 * @typedef {Object} FiltrosJogadores
 * @property {string} [search]
 * @property {string} [position]
 * @property {string} [condition]
 * @property {boolean} [free]
 * @property {number} [clubId]
 * @property {number} [minAge]
 * @property {number} [maxAge]
 * @property {number} [minValue]
 * @property {number} [maxValue]
 * @property {'name'|'value_asc'|'value_desc'|'age_asc'|'age_desc'|'position'} [sort]
 * @property {number} [page]
 * @property {number} [limit]
 */

/** @param {FiltrosJogadores} filtros */
function montarParametros(filtros = {}) {
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
    Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== null && valor !== ''),
  );
}

export const jogadorService = {
  /** @param {FiltrosJogadores} [filtros] */
  async listarJogadores(filtros = {}) {
    const response = await api.get('/players', {
      params: montarParametros(filtros),
    });
    return response.data;
  },

  async buscarJogadorPorId(id) {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },

  async cadastrarJogador(dadosJogador) {
    const response = await api.post('/players', dadosJogador);
    return response.data;
  },

  async editarJogador(id, dadosAtualizados) {
    const response = await api.put(`/players/${id}`, dadosAtualizados);
    return response.data;
  },

  async alterarCondicao(id, condition) {
    const response = await api.patch(`/players/${id}/condition`, { condition });
    return response.data;
  },

  async excluirJogador(id) {
    const response = await api.delete(`/players/${id}`);
    return response.data;
  },

  async excluirJogadoresLivres() {
    const primeiraPagina = await this.listarJogadores({ free: true, page: 1, limit: 50 });
    const ids = new Set(primeiraPagina.data.map((jogador) => jogador.id));
    const totalPaginas = primeiraPagina.meta?.total_pages ?? 0;

    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
      const resultado = await this.listarJogadores({ free: true, page: pagina, limit: 50 });
      resultado.data.forEach((jogador) => ids.add(jogador.id));
    }

    for (const id of ids) {
      await this.excluirJogador(id);
    }

    return { deletedCount: ids.size };
  },
};