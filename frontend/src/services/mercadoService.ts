import api from './api';
import type { CompraResultado, VendaResultado } from '../types/transactions';

export type DadosCompra = {
  clubId: number;
  loyaltyUntil: string;
};

export const mercadoService = {
  async comprarJogador(playerId: number, dadosCompra: DadosCompra): Promise<CompraResultado> {
    const response = await api.post<CompraResultado>(`/players/${playerId}/buy`, {
      club_id: dadosCompra.clubId,
      loyalty_until: dadosCompra.loyaltyUntil,
    });
    return response.data;
  },

  async venderJogador(playerId: number): Promise<VendaResultado> {
    const response = await api.post<VendaResultado>(`/players/${playerId}/sell`);
    return response.data;
  },
};
