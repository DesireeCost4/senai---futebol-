import { X, Pencil, HeartPulse, ShoppingCart, HelpCircle } from 'lucide-react';
import './DetalhesJogadorDialog.css';
import type { Jogador } from '../types/players';

type Props = {
  player: Jogador;
  clubes: { id: number; name: string }[];
  onClose: () => void;
  onEdit: (player: Jogador) => void;
  onChangeCondition: (player: Jogador) => void;
  onBuy?: (player: Jogador) => void;
};

export default function DetalhesJogadorDialog({
  player,
  clubes,
  onClose,
  onEdit,
  onChangeCondition,
  onBuy,
}: Props) {
  const initials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
  };

  const formatAmount = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '—';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const conditionLabel = (cond: string) => {
    if (cond === 'DOENTE') return 'Doente';
    if (cond === 'MAL_CONDICIONADO') return 'Mal condicionado';
    return 'Apto';
  };

  const clubName = player.club_id
    ? (clubes.find((c) => c.id === player.club_id)?.name ?? 'Clube')
    : 'Livre';

  const technicalAttributes = [
    { key: 'pace', label: 'Velocidade', value: player.pace ?? 70 },
    { key: 'shooting', label: 'Finalização', value: player.shooting ?? 70 },
    { key: 'passing', label: 'Passe', value: player.passing ?? 70 },
    { key: 'dribbling', label: 'Drible', value: player.dribbling ?? 70 },
    { key: 'defending', label: 'Defesa', value: player.defending ?? 50 },
    { key: 'physical', label: 'Físico', value: player.physical ?? 60 },
  ];

  return (
    <div
      className="detalhes-jogador-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="detalhes-jogador-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhes-jogador-title"
      >
        <button
          className="detalhes-jogador__close"
          type="button"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <header className="detalhes-jogador__header">
          <span className="detalhes-jogador__avatar">{initials(player.name)}</span>
          <div className="detalhes-jogador__title-group">
            <h2 id="detalhes-jogador-title">{player.name}</h2>
            <div className="detalhes-jogador__badges">
              <span className="badge-pos">{player.position}</span>
              <span className={`badge-cond badge-cond--${player.condition.toLowerCase()}`}>
                • {conditionLabel(player.condition)}
              </span>
              <span className="badge-club">{clubName}</span>
            </div>
          </div>
        </header>

        <div className="detalhes-jogador__metrics">
          <div className="metric-card">
            <div className="metric-header">
              <span>Valor de mercado</span>
              <HelpCircle size={13} className="help-icon" />
            </div>
            <strong>{formatAmount(player.market_value)}</strong>
            <small>Calculado automaticamente</small>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span>Valor base</span>
              <HelpCircle size={13} className="help-icon" />
            </div>
            <strong>{formatAmount(player.base_value)}</strong>
            <small>Calculado no cadastro</small>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span>Overall</span>
              <HelpCircle size={13} className="help-icon" />
            </div>
            <strong>{player.overall}</strong>
            <small>Calculado pela posição</small>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span>Potencial</span>
              <HelpCircle size={13} className="help-icon" />
            </div>
            <strong>{player.potential ?? 86}</strong>
            <small>Informado no cadastro</small>
          </div>
        </div>

        <div className="detalhes-jogador__section-title">
          <h3>Indicadores técnicos</h3>
          <span className="scale-info">Escala de 1 a 99</span>
        </div>

        <div className="detalhes-jogador__attributes">
          {technicalAttributes.map((attr) => (
            <div className="attribute-row" key={attr.key}>
              <span>{attr.label}</span>
              <div className="attribute-track">
                <div
                  className="attribute-fill"
                  style={{ width: `${Math.min(attr.value, 100)}%` }}
                />
              </div>
              <strong>{attr.value}</strong>
            </div>
          ))}
          <div className="attributes-legend">
            <span className="legend-dot" /> Valor do atributo{' '}
            <span className="legend-dot legend-dot--potential" /> Até o potencial (
            {player.potential ?? 86}), que nenhum atributo passa
          </div>
        </div>

        <div className="detalhes-jogador__info-list">
          <div className="info-item">
            <span>Idade</span>
            <strong>{player.age} anos</strong>
          </div>
          <div className="info-item">
            <span>Agilidade</span>
            <strong>{player.agility}</strong>
          </div>
          <div className="info-item">
            <span>Clube</span>
            <strong>{clubName}</strong>
          </div>
        </div>

        <footer className="detalhes-jogador__footer">
          <button
            type="button"
            className="btn-action btn-edit"
            onClick={() => {
              onClose();
              onEdit(player);
            }}
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            type="button"
            className="btn-action btn-condition"
            onClick={() => {
              onClose();
              onChangeCondition(player);
            }}
          >
            <HeartPulse size={14} /> Alterar condição
          </button>
          {!player.club_id && onBuy && (
            <button
              type="button"
              className="btn-action btn-buy"
              onClick={() => {
                onClose();
                onBuy(player);
              }}
            >
              <ShoppingCart size={14} /> Comprar
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
