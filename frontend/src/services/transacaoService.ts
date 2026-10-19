import api from './api';
import type { HistoricoTransacoes, TipoTransacao } from '../types/transactions';

export type FiltrosTransacoes = {
  types?: TipoTransacao[];
  playerId?: number;
};

export type ArquivoTransacoes = {
  blob: Blob;
  filename: string;
};

function montarParametros(filtros: FiltrosTransacoes = {}) {
  return {
    type: filtros.types?.length ? filtros.types.join(',') : undefined,
    player_id: filtros.playerId,
  };
}

export const transacaoService = {
  async listarPorClube(clubId: number, filtros: FiltrosTransacoes = {}): Promise<HistoricoTransacoes> {
    const response = await api.get<HistoricoTransacoes>(`/clubs/${clubId}/transactions`, {
      params: montarParametros(filtros),
    });
    return response.data;
  },

  async exportarCsv(clubId: number, filtros: FiltrosTransacoes = {}): Promise<ArquivoTransacoes> {
    const response = await api.get<Blob>(`/clubs/${clubId}/transactions/export`, {
      params: montarParametros(filtros),
      responseType: 'blob',
    });
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const filename = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
      ?? `transacoes_clube_${clubId}.csv`;

    return { blob: response.data, filename };
  },
};