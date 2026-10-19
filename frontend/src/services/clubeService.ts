import api from './api';
import type { Clube, NovoClube, OrdenacaoClubes } from '../types/clubs';

export const clubeService = {
  async listarClubes(sort: OrdenacaoClubes = 'name'): Promise<Clube[]> {
    const response = await api.get<Clube[]>('/clubs', { params: { sort } });
    return response.data;
  },

  async buscarClubePorId(id: number): Promise<Clube> {
    const response = await api.get<Clube>(`/clubs/${id}`);
    return response.data;
  },

  async criarClube(dadosClube: NovoClube): Promise<Clube> {
    const response = await api.post<Clube>('/clubs', dadosClube);
    return response.data;
  },
};
