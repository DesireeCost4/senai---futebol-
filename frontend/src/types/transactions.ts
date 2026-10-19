export type CompraResultado = {
  id: number;
  type: 'COMPRA';
  player_id: number;
  player_name: string;
  value: number | string;
  fee: number | string;
  contract: {
    purchase_value: number | string;
    loyalty_until: string;
    status: string;
  };
  club_cash: number | string;
};

export type VendaResultado = {
  id: number;
  type: 'VENDA';
  player_id: number;
  player_name: string;
  purchase_value: number | string;
  value: number | string;
  remaining_days: number;
  penalty_rate: number;
  penalty: number | string;
  profit: number | string;
  fee: number | string;
  cash_change: number | string;
  club_cash: number | string;
};

export type ResultadoTransacao = CompraResultado | VendaResultado;

export type TipoTransacao = 'COMPRA' | 'VENDA';

export type Transacao = {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TipoTransacao;
  value: number | string;
  fee: number | string;
  penalty: number | string;
  profit: number | string | null;
  cash_change: number | string;
  created_at: string;
};

export type TransacoesSummary = {
  total_spent: number | string;
  total_received: number | string;
  total_fees: number | string;
  total_penalties: number | string;
  total_profit: number | string;
};

export type HistoricoTransacoes = {
  data: Transacao[];
  summary: TransacoesSummary;
};