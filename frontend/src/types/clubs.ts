import type { Player } from './league';

export type OrdenacaoClubes = 'name' | 'net_worth_asc' | 'net_worth_desc';

export type Clube = {
  id: number;
  name: string;
  acronym: string;
  cash: number | string;
  squad_value: number | string;
  net_worth: number | string;
  players?: Player[];
};

export type NovoClube = {
  name: string;
  acronym: string;
};
