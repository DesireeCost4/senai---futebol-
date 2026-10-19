import { X } from 'lucide-react';
import { formatDateTimeBrasilia } from '../utils/formatters';
import type { Match } from '../types/league';
import './DuelsDialog.css';

type Props = {
  match: Match;
  onClose: () => void;
};

function attributeLabel(attribute: string): string {
  const labels: Record<string, string> = {
    shooting: 'Finalização',
    passing: 'Passe',
    dribbling: 'Drible',
    defending: 'Defesa',
  };
  return labels[attribute] ?? attribute;
}

export default function DuelsDialog({ match, onClose }: Props) {
  return (
    <div
      className="duels-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="duels-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duels-title"
      >
        <button
          type="button"
          className="duels-dialog__close"
          aria-label="Fechar duelos"
          onClick={onClose}
        >
          <X size={17} />
        </button>
        <p className="duels-dialog__eyebrow">
          Partida #{match.id} · {formatDateTimeBrasilia(match.played_at)}
        </p>
        <h2 id="duels-title">
          {match.home.club_name}{' '}
          <strong>
            {match.home.goals} × {match.away.goals}
          </strong>{' '}
          {match.away.club_name}
        </h2>
        <p className="duels-dialog__formations">
          Formação {match.home.formation} · {match.away.formation}
        </p>

        <div className="duels-list">
          {match.duels?.map((duel) => (
            <article className={duel.goal ? 'duel duel--goal' : 'duel'} key={duel.order}>
              <span className="duel__order">{duel.order}</span>
              <div className="duel__player duel__player--attacker">
                <strong>{duel.attacker.player_name}</strong>
                <span>
                  {duel.attacker.position} · {duel.attacker.condition}
                </span>
                <small>
                  {attributeLabel(duel.attacker.attribute)} <b>{duel.attacker.value}</b>
                </small>
              </div>
              <span className="duel__versus">{duel.goal ? 'GOL' : '×'}</span>
              <div className="duel__player duel__player--defender">
                <strong>{duel.defender.player_name}</strong>
                <span>
                  {duel.defender.position} · {duel.defender.condition}
                </span>
                <small>
                  {attributeLabel(duel.defender.attribute)} <b>{duel.defender.value}</b>
                </small>
              </div>
            </article>
          ))}
        </div>
        {(!match.duels || match.duels.length === 0) && (
          <p className="duels-empty">Os duelos desta partida não estão disponíveis.</p>
        )}
      </section>
    </div>
  );
}
