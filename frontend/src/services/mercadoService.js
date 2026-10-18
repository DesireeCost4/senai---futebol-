import api from './api';

export const mercadoService = {
  /** @param {{ clubId: number, loyaltyUntil: string }} dadosCompra */
  async comprarJogador(playerId, dadosCompra) {
    const response = await api.post(`/players/${playerId}/buy`, {
      club_id: dadosCompra.clubId,
      loyalty_until: dadosCompra.loyaltyUntil,
    });
    return response.data;
  },

  async venderJogador(playerId) {
    const response = await api.post(`/players/${playerId}/sell`);
    return response.data;
  },
};