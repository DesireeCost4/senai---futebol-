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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DuelsDialog({ match, onClose }: Props) {
  const duels = match.duels ?? [];
  const homePlayers = duels.flatMap((duel) =>
    duel.attacking_club_id === match.home.club_id ? [duel.attacker] : [duel.defender],
  );
  const awayPlayers = duels.flatMap((duel) =>
    duel.attacking_club_id === match.away.club_id ? [duel.attacker] : [duel.defender],
  );
  const uniquePlayers = (players: typeof homePlayers) => [
    ...new Map(players.map((player) => [player.player_id, player])).values(),
  ];

  const renderFieldPlayers = (players: typeof homePlayers, side: 'home' | 'away') =>
    uniquePlayers(players)
      .slice(0, 6)
      .map((player, index) => (
        <span
          className={`match-field__player match-field__player--${side} match-field__player--${index + 1}`}
          key={`${side}-${player.player_id}`}
          title={`${player.player_name} · ${player.position}`}
        >
          <span className="match-field__player-avatar">{initials(player.player_name)}</span>
          <strong>{player.player_name.split(' ')[0]}</strong>
          <small>{player.position}</small>
        </span>
      ));

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

        <section className="match-field-panel" aria-label="Campo e escalações">
          <header className="match-field-panel__header">
            <h3>Em campo</h3>
            <span>
              {match.home.club_name} · {match.home.formation} &nbsp; × &nbsp; {match.away.club_name}{' '}
              · {match.away.formation}
            </span>
          </header>
          <div className="match-field">
            <span className="match-field__half-line" aria-hidden="true" />
            <span className="match-field__center-circle" aria-hidden="true" />
            <span className="match-field__goal match-field__goal--home" aria-hidden="true" />
            <span className="match-field__goal match-field__goal--away" aria-hidden="true" />
            {renderFieldPlayers(homePlayers, 'home')}
            {renderFieldPlayers(awayPlayers, 'away')}
            {!duels.length && (
              <p className="match-field__empty">Escalações desta partida não estão disponíveis.</p>
            )}
          </div>
        </section>

        <div className="duels-list">
          {duels.map((duel) => (
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
