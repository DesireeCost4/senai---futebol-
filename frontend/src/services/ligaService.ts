import api from './api';
import type { ClubeLiga, Lineup, Match, Standing } from '../types/league';

export const ligaService = {
  async buscarEscalacao(clubId: number): Promise<Lineup> {
    const response = await api.get<Lineup>(`/clubs/${clubId}/lineup`);
    return response.data;
  },

  async salvarEscalacao(clubId: number, formation: string, playerIds: number[]): Promise<Lineup> {
    const response = await api.put<Lineup>(`/clubs/${clubId}/lineup`, {
      formation,
      player_ids: playerIds,
    });
    return response.data;
  },

  async jogarPartida(homeClubId: number, awayClubId: number): Promise<Match> {
    const response = await api.post<Match>('/matches', {
      home_club_id: homeClubId,
      away_club_id: awayClubId,
    });
    return response.data;
  },

  async listarPartidas(clubId?: number): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches', {
      params: clubId ? { club_id: clubId } : undefined,
    });
    return response.data;
  },

  async buscarPartida(matchId: number): Promise<Match> {
    const response = await api.get<Match>(`/matches/${matchId}`);
    return response.data;
  },

  async listarClassificacao(): Promise<Standing[]> {
    const response = await api.get<Standing[]>('/standings');
    return response.data;
  },

  async listarClubes(): Promise<ClubeLiga[]> {
    const response = await api.get<ClubeLiga[]>('/clubs');
    return response.data;
  },
};