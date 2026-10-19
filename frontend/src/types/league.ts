export type Player = {
  id: number;
  name: string;
  position: string;
  condition: string;
  overall: number | null;
  agility?: number | null;
  club_id?: number | null;
  [key: string]: string | number | null | undefined;
};

export type Lineup = {
  club_id: number;
  formation: string | null;
  complete: boolean;
  players: Player[];
};

export type ClubeLiga = {
  id: number;
  name: string;
  acronym: string;
};

export type DuelPlayer = {
  player_id: number;
  player_name: string;
  position: string;
  condition: string;
  attribute: string;
  value: number;
};

export type Duel = {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayer;
  defender: DuelPlayer;
  goal: boolean;
};

export type Match = {
  id: number;
  played_at: string;
  home: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  away: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
  duels?: Duel[] | null;
};

export type Standing = {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};
