import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Trophy, UsersRound } from 'lucide-react';
import './LeagueNavigation.css';

type Props = {
  clubId?: number;
  active?: 'lineup' | 'matches' | 'history' | 'standings';
};

export default function LeagueNavigation({ clubId, active }: Props) {
  return (
    <nav className="league-navigation" aria-label="Navegação da liga">
      {clubId && (
        <Link
          className={
            active === 'lineup'
              ? 'league-navigation__link league-navigation__link--active'
              : 'league-navigation__link'
          }
          to={`/clubs/${clubId}/lineup`}
        >
          <UsersRound size={14} />
          Escalação
        </Link>
      )}
      <Link
        className={
          active === 'matches'
            ? 'league-navigation__link league-navigation__link--active'
            : 'league-navigation__link'
        }
        to="/matches"
      >
        <CalendarDays size={14} />
        Partidas
      </Link>
      <Link
        className={
          active === 'history'
            ? 'league-navigation__link league-navigation__link--active'
            : 'league-navigation__link'
        }
        to="/matches/history"
      >
        <ClipboardList size={14} />
        Histórico
      </Link>
      <Link
        className={
          active === 'standings'
            ? 'league-navigation__link league-navigation__link--active'
            : 'league-navigation__link'
        }
        to="/standings"
      >
        <Trophy size={14} />
        Classificação
      </Link>
    </nav>
  );
}
