import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crosshair,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { clubeService } from '../services/clubeService';
import type { Clube } from '../types/clubs';
import './AppShell.css';

type Props = {
  children: ReactNode;
};

function breadcrumb(pathname: string, clubs: Clube[]): string[] {
  if (pathname === '/players') return ['Mercado', 'Jogadores'];
  if (pathname.startsWith('/clubs/')) {
    const [, , id, section] = pathname.split('/');
    const clubName = clubs.find((club) => club.id === Number(id))?.name ?? 'Clube';
    return section === 'lineup'
      ? ['Mercado', 'Clubes', clubName, 'Escalação']
      : ['Mercado', 'Clubes', clubName];
  }
  if (pathname === '/matches/history') return ['Liga', 'Partidas', 'Histórico'];
  if (pathname.startsWith('/matches/')) {
    return ['Liga', 'Partidas', 'Detalhes da partida'];
  }
  if (pathname === '/matches') return ['Liga', 'Partidas'];
  if (pathname === '/standings') return ['Liga', 'Classificação'];
  return ['Mercado', 'Clubes'];
}

export default function AppShell({ children }: Props) {
  const { pathname } = useLocation();
  const [clubs, setClubs] = useState<Clube[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadClubs() {
      try {
        const response = await clubeService.listarClubes('name');
        if (!cancelled) setClubs(response);
      } catch {
        if (!cancelled) setClubs([]);
      }
    }
    void loadClubs();
    return () => {
      cancelled = true;
    };
  }, []);

  const crumbs = breadcrumb(pathname, clubs);
  const currentClubId = pathname.startsWith('/clubs/') ? Number(pathname.split('/')[2]) : null;

  if (pathname === '/') return <>{children}</>;

  return (
    <div className="app-frame">
      <aside className="app-sidebar" aria-label="Navegação principal">
        <Link className="app-brand" to="/" aria-label="Passe, página inicial">
          <span className="app-brand__mark">P</span>
          <span className="app-brand__name">
            Passe<small>Gestão da liga</small>
          </span>
        </Link>

        <nav className="app-sidebar__nav">
          <section className="app-sidebar__group" aria-label="Mercado">
            <p className="app-sidebar__label">Mercado</p>
            <Link
              className={
                pathname === '/players'
                  ? 'app-sidebar__link app-sidebar__link--active'
                  : 'app-sidebar__link'
              }
              to="/players"
            >
              <UsersRound size={15} />
              Jogadores
            </Link>
            <Link
              className={
                pathname.startsWith('/clubs')
                  ? 'app-sidebar__link app-sidebar__link--active'
                  : 'app-sidebar__link'
              }
              to="/clubs"
            >
              <Building2 size={15} />
              Clubes
            </Link>
          </section>

          <section className="app-sidebar__group" aria-label="Liga">
            <p className="app-sidebar__label">Liga</p>
            <Link
              className={
                pathname.startsWith('/matches')
                  ? 'app-sidebar__link app-sidebar__link--active'
                  : 'app-sidebar__link'
              }
              to="/matches"
            >
              <CalendarDays size={15} />
              Partidas
            </Link>
            <Link
              className={
                pathname === '/standings'
                  ? 'app-sidebar__link app-sidebar__link--active'
                  : 'app-sidebar__link'
              }
              to="/standings"
            >
              <Trophy size={15} />
              Classificação
            </Link>
          </section>

          <section className="app-sidebar__group app-sidebar__clubs" aria-label="Clubes">
            <div className="app-sidebar__label-row">
              <p className="app-sidebar__label">Clubes</p>
              <span>{clubs.length}</span>
            </div>
            {clubs.length === 0 && <p className="app-sidebar__empty">Nenhum clube ainda.</p>}
            {clubs.map((club, index) => (
              <Link
                className={
                  currentClubId === club.id
                    ? 'app-sidebar__club app-sidebar__club--active'
                    : 'app-sidebar__club'
                }
                to={`/clubs/${club.id}`}
                key={club.id}
                title={club.name}
              >
                <span className={`app-sidebar__club-mark app-sidebar__club-mark--${index % 5}`}>
                  {club.acronym.slice(0, 1)}
                </span>
                <span>{club.name}</span>
              </Link>
            ))}
          </section>
        </nav>

        <footer className="app-sidebar__footer">
          <section className="app-sidebar__footer-card">
            <div>
              <Trophy size={13} />
              <strong>Liga Fictícia 2026</strong>
            </div>
            <small>
              {clubs.length} clubes · {clubs.length === 0 ? 0 : 23} jogadores
            </small>
          </section>
          <section className="app-sidebar__footer-card">
            <div>
              <Crosshair size={13} />
              <strong>Última partida</strong>
            </div>
            <small>{clubs.length === 0 ? 'Nenhuma ainda' : 'Delta FC 2 × 1 Águias FC'}</small>
          </section>
          <div className="app-sidebar__timezone">
            <Clock3 size={11} /> Horário de Brasília (UTC−3)
          </div>
        </footer>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__breadcrumb">
            {crumbs.map((crumb, index) => (
              <span
                key={`${crumb}-${index}`}
                className={index === crumbs.length - 1 ? 'app-topbar__current' : undefined}
              >
                {index > 0 && <ChevronRight size={12} />}
                {crumb}
              </span>
            ))}
          </div>
          <div className="app-topbar__time">
            <Clock3 size={13} />
            Horário de Brasília (UTC−3)
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
