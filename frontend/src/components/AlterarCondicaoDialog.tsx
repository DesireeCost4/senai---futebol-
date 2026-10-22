import { X, Check } from 'lucide-react';
import { useState } from 'react';
import './AlterarCondicaoDialog.css';
import type { Jogador, CondicaoJogador } from '../types/players';

type Props = {
  player: Jogador;
  currentCondition: CondicaoJogador;
  onClose: () => void;
  onSave: (newCondition: CondicaoJogador) => void;
};

export default function AlterarCondicaoDialog({ player, currentCondition, onClose, onSave }: Props) {
  const [selectedCondition, setSelectedCondition] = useState<CondicaoJogador>(
    currentCondition === 'DOENTE' ? 'MAL_CONDICIONADO' : currentCondition
  );

  const handleSave = () => {
    onSave(selectedCondition);
  };

  const initials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className="alterar-condicao-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="alterar-condicao-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alterar-condicao-title"
      >
        <button
          className="alterar-condicao-dialog__close"
          type="button"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={17} />
        </button>
        <h2 id="alterar-condicao-title">Alterar condição física</h2>
        <p className="alterar-condicao-dialog__description">
          A condição muda o desconto do valor de mercado, recalculado ao salvar.
        </p>

        <div className="alterar-condicao-dialog__player-info">
          <span className="player-avatar">{initials(player.name)}</span>
          <div className="player-details">
            <p className="player-name">{player.name}</p>
            <p className="player-meta">{player.position} - Lateral - {player.age} anos</p>
          </div>
          <span className="current-condition">
            <span className="dot" /> {currentCondition === 'DOENTE' ? 'Doente' : currentCondition === 'MAL_CONDICIONADO' ? 'Mal condicionado' : 'Apto'}
          </span>
        </div>

        <div className="alterar-condicao-dialog__options">
          <label className={selectedCondition === 'APTO' ? 'selected' : ''}>
            <div className="option-header">
              <input
                type="radio"
                name="condition"
                value="APTO"
                checked={selectedCondition === 'APTO'}
                disabled={currentCondition === 'DOENTE'}
                onChange={() => setSelectedCondition('APTO')}
              />
              <strong>Apto</strong>
            </div>
            <span>Sem desconto por condição.</span>
            <span>De Doente não passa direto para Apto.</span>
          </label>

          <label className={selectedCondition === 'MAL_CONDICIONADO' ? 'selected' : ''}>
            <div className="option-header">
              <input
                type="radio"
                name="condition"
                value="MAL_CONDICIONADO"
                checked={selectedCondition === 'MAL_CONDICIONADO'}
                onChange={() => setSelectedCondition('MAL_CONDICIONADO')}
              />
              <strong>Mal condicionado</strong>
            </div>
            <span>Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.</span>
          </label>

          <label className={selectedCondition === 'DOENTE' ? 'selected' : ''}>
            <div className="option-header">
              <input
                type="radio"
                name="condition"
                value="DOENTE"
                checked={selectedCondition === 'DOENTE'}
                onChange={() => setSelectedCondition('DOENTE')}
              />
              <strong>Doente</strong>
              {currentCondition === 'DOENTE' && <span className="current-status">Atual</span>}
            </div>
            <span>Desconto de 30%, com o mesmo ajuste de agilidade.</span>
          </label>
        </div>

        <div className="alterar-condicao-dialog__actions">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="button" onClick={handleSave} className="btn-save">
            <Check size={14} /> Salvar condição
          </button>
        </div>
      </section>
    </div>
  );
}
