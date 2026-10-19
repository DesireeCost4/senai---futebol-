import { ClipboardList, Shirt } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ClubTabs.css';

type Props = {
  clubId: number;
  active: 'elenco' | 'lineup' | 'history';
  squadCount?: number;
  historyCount?: number;
};

export default function ClubTabs({ clubId, active, squadCount, historyCount }: Props) {
  return (
    <nav className="club-tabs" aria-label="Seções do clube">
      <Link className={active === 'elenco' ? 'club-tab club-tab--active' : 'club-tab'} to={`/clubs/${clubId}`}>
        <Shirt size={14} />Elenco{ squadCount !== undefined && <span>{squadCount}</span> }
      </Link>
      <Link className={active === 'lineup' ? 'club-tab club-tab--active' : 'club-tab'} to={`/clubs/${clubId}/lineup`}>
        <span className="club-tab__lineup-icon" aria-hidden="true">⌘</span>Escalação
      </Link>
      <Link className={active === 'history' ? 'club-tab club-tab--active' : 'club-tab'} to={`/clubs/${clubId}?tab=history`}>
        <ClipboardList size={14} />Histórico{ historyCount !== undefined && <span>{historyCount}</span> }
      </Link>
    </nav>
  );
}