import type { Match } from '../types/league';
import './DuelsField.css';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function label(attribute: string): string {
  return (
    (
      {
        shooting: 'Finalização',
        passing: 'Passe',
        dribbling: 'Drible',
        defending: 'Defesa',
      } as Record<string, string>
    )[attribute] ?? attribute
  );
}

type Props = { match: Match };

export default function DuelsField({ match }: Props) {
  const duels = match.duels ?? [];
  const home = duels.flatMap((duel) =>
    duel.attacking_club_id === match.home.club_id ? [duel.attacker] : [duel.defender],
  );
  const away = duels.flatMap((duel) =>
    duel.attacking_club_id === match.away.club_id ? [duel.attacker] : [duel.defender],
  );
  const players = (items: typeof home) =>
    [...new Map(items.map((player) => [player.player_id, player])).values()].slice(0, 6);

  return (
    <section className="duels-field-page">
      <header>
        <div>
          <h2>Em campo</h2>
          <p>
            {' '}
            titulares de cada clube na formação da partida e os valores usados nos duelos, já com o
            efeito da condição.
          </p>
        </div>
        <span className="duels-field-page__legend">
          <b>●</b> Mal condicionado &nbsp; <b>◉</b> Gol na disputa
        </span>
      </header>
      <div className="duels-field">
        <span className="duels-field__half" />
        <span className="duels-field__circle" />
        <span className="duels-field__goal duels-field__goal--left" />
        <span className="duels-field__goal duels-field__goal--right" />
        <span className="duels-field__team duels-field__team--home">
          {match.home.club_name} · {match.home.formation} · ataca →
        </span>
        <span className="duels-field__team duels-field__team--away">
          ← {match.away.club_name} · {match.away.formation}
        </span>
        {players(home).map((player, index) => (
          <span
            className={`field-player field-player--home field-player--${index + 1}`}
            key={`h-${player.player_id}`}
          >
            <i>{initials(player.player_name)}</i>
            <b>{player.player_name.split(' ')[0]}</b>
            <small>
              {player.position} · {player.value}
            </small>
          </span>
        ))}
        {players(away).map((player, index) => (
          <span
            className={`field-player field-player--away field-player--${index + 1}`}
            key={`a-${player.player_id}`}
          >
            <i>{initials(player.player_name)}</i>
            <b>{player.player_name.split(' ')[0]}</b>
            <small>
              {player.position} · {player.value}
            </small>
          </span>
        ))}
        {!duels.length && <p>Escalações desta partida não estão disponíveis.</p>}
      </div>
      <section className="duels-table">
        <header>
          <h2>Duelos</h2>
          <p>
            Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de linha vão do 1º ao
            5º ataque.
          </p>
        </header>
        <div className="duels-table__columns">
          <span>Duelo</span>
          <span>Atacante</span>
          <span>Ataque</span>
          <span>Defensor</span>
          <span>Defesa</span>
          <span>Resultado</span>
        </div>
        {duels.map((duel) => (
          <div className="duels-table__row" key={duel.order}>
            <span>{duel.order}</span>
            <strong>
              {duel.attacker.player_name}
              <small>
                {duel.attacker.position} · {duel.attacker.condition}
              </small>
            </strong>
            <span>
              {label(duel.attacker.attribute)} <b>{duel.attacker.value}</b>
            </span>
            <strong>
              {duel.defender.player_name}
              <small>
                {duel.defender.position} · {duel.defender.condition}
              </small>
            </strong>
            <span>
              {label(duel.defender.attribute)} <b>{duel.defender.value}</b>
            </span>
            <b>{duel.goal ? '✓ Gol' : 'Sem gol'}</b>
          </div>
        ))}
      </section>
      <p className="duels-field-page__note">
        Mesmo após jogar e abrir uma partida do histórico, a tela mostra as formações dos dois
        clubes e os 6 duelos. Os valores e a condição de cada titular vêm gravados nos duelos
        devolvidos pela API, incluindo condição com 15% a menos (RN20).
      </p>
    </section>
  );
}
