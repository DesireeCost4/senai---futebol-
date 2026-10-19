export type OrdenacaoJogadores =
  'name' | 'value_asc' | 'value_desc' | 'age_asc' | 'age_desc' | 'position';

export type FiltrosJogadores = {
  search?: string;
  position?: string;
  condition?: string;
  free?: boolean;
  clubId?: number;
  minAge?: number;
  maxAge?: number;
  minValue?: number;
  maxValue?: number;
  sort?: OrdenacaoJogadores;
  page?: number;
  limit?: number;
};

export type Jogador = {
  id: number;
  name: string;
  position: string;
  agility: number;
  age: number;
  condition: string;
  base_value: number | string;
  market_value: number | string;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  potential?: number;
  overall: number;
  club_id?: number | null;
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

export type NovoJogador = Pick<Jogador, 'name' | 'position' | 'agility' | 'age'> & {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
};

export type EdicaoJogador = Pick<Jogador, 'name' | 'position' | 'agility' | 'age'>;

export type CondicaoJogador = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';
