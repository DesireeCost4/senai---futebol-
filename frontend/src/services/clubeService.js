import api from './api';

export const clubeService = {
  /** @param {'name'|'net_worth_asc'|'net_worth_desc'} [sort] */
  async listarClubes(sort = 'name') {
    const response = await api.get('/clubs', { params: { sort } });
    return response.data;
  },

  async buscarClubePorId(id) {
    const response = await api.get(`/clubs/${id}`);
    return response.data;
  },

  async criarClube(dadosClube) {
    const response = await api.post('/clubs', dadosClube);
    return response.data;
  },
};