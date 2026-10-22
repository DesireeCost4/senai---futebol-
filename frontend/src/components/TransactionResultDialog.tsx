import { Check, X } from 'lucide-react';
import { formatCurrency, formatDateTimeBrasilia } from '../utils/formatters';
import type { ResultadoTransacao, VendaResultado } from '../types/transactions';
import './TransactionResultDialog.css';

type Props = {
  result: ResultadoTransacao;
  onClose: () => void;
};

function isSale(result: ResultadoTransacao): result is VendaResultado {
  return result.type === 'VENDA';
}

export default function TransactionResultDialog({ result, onClose }: Props) {
  const venda = isSale(result);
  const custoTotal = venda ? null : Number(result.value) + Number(result.fee);
  const vendaEncerrada = venda && Number(result.remaining_days) <= 0;

  return (
    <div
      className="transaction-result-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`transaction-result${venda ? ' transaction-result--sale' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-result-title"
      >
        <button
          className="transaction-result__close"
          type="button"
          aria-label="Fechar resultado"
          onClick={onClose}
        >
          <X size={17} />
        </button>
        <span className="transaction-result__icon">
          <Check size={19} />
        </span>
        <h2 id="transaction-result-title">{venda ? 'Venda concluída' : 'Compra concluída'}</h2>
        <p className="transaction-result__player">
          {venda
            ? `${result.player_name} voltou a ficar livre e saiu da escalação.`
            : result.player_name}
        </p>
        {venda && (
          <p className="transaction-result__description">
            {vendaEncerrada
              ? 'A fidelidade já tinha terminado, então não houve multa.'
              : 'O contrato foi encerrado antes do fim da fidelidade.'}
          </p>
        )}

        <dl className="transaction-result__fields">
          {venda ? (
            <>
              <div>
                <dt>Valor de compra</dt>
                <dd>{formatCurrency(result.purchase_value)}</dd>
              </div>
              <div>
                <dt>
                  Valor de venda
                  <small>Valor de mercado no momento da venda</small>
                </dt>
                <dd>{formatCurrency(result.value)}</dd>
              </div>
              <div>
                <dt>Dias restantes</dt>
                <dd>{result.remaining_days}</dd>
              </div>
              <div>
                <dt>
                  Multa
                  <small>
                    {vendaEncerrada
                      ? 'Fidelidade cumprida: sem multa'
                      : `${result.penalty_rate}% do valor de venda`}
                  </small>
                </dt>
                <dd>{formatCurrency(result.penalty)}</dd>
              </div>
              <div>
                <dt>Lucro</dt>
                <dd
                  className={
                    Number(result.profit) < 0
                      ? 'transaction-result__negative'
                      : 'transaction-result__positive'
                  }
                >
                  {Number(result.profit) > 0 ? '+' : ''}
                  {formatCurrency(result.profit)}
                </dd>
              </div>
              <div>
                <dt>Comissão</dt>
                <dd>{formatCurrency(result.fee)}</dd>
              </div>
              <div>
                <dt>Crédito no caixa</dt>
                <dd>
                  {Number(result.cash_change) > 0 ? '+' : ''}
                  {formatCurrency(result.cash_change)}
                </dd>
              </div>
              <div>
                <dt>Contrato</dt>
                <dd>
                  <span
                    className={`transaction-result__status transaction-result__status--${vendaEncerrada ? 'closed' : 'cancelled'}`}
                  >
                    {vendaEncerrada ? 'ENCERRADO' : 'RESCINDIDO'}
                  </span>
                </dd>
              </div>
              <div className="transaction-result__total">
                <dt>Nova caixa do clube</dt>
                <dd>{formatCurrency(result.club_cash)}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt>Valor do jogador</dt>
                <dd>{formatCurrency(result.value)}</dd>
              </div>
              <div>
                <dt>Taxa</dt>
                <dd>{formatCurrency(result.fee)}</dd>
              </div>
              <div className="transaction-result__total">
                <dt>Custo total</dt>
                <dd>{formatCurrency(custoTotal)}</dd>
              </div>
              <div>
                <dt>Fim da fidelidade</dt>
                <dd>{formatDateTimeBrasilia(result.contract.loyalty_until)}</dd>
              </div>
              <div>
                <dt>Contrato</dt>
                <dd>{result.contract.status || 'Ativo'}</dd>
              </div>
              <div>
                <dt>Nova caixa</dt>
                <dd>{formatCurrency(result.club_cash)}</dd>
              </div>
            </>
          )}
        </dl>

        <footer className="transaction-result__actions">
          {venda && (
            <button className="transaction-result__history" type="button" onClick={onClose}>
              ↶&nbsp; Ver histórico
            </button>
          )}
          <button className="transaction-result__done" type="button" onClick={onClose}>
            {venda ? 'Fechar' : 'Continuar'}
          </button>
        </footer>
      </section>
    </div>
  );
}
