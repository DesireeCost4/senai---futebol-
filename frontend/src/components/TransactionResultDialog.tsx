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

  return (
    <div className="transaction-result-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="transaction-result" role="dialog" aria-modal="true" aria-labelledby="transaction-result-title">
        <button className="transaction-result__close" type="button" aria-label="Fechar resultado" onClick={onClose}><X size={17} /></button>
        <span className="transaction-result__icon"><Check size={19} /></span>
        <h2 id="transaction-result-title">{venda ? 'Venda concluída' : 'Compra concluída'}</h2>
        <p className="transaction-result__player">{result.player_name}</p>

        <dl className="transaction-result__fields">
          {venda ? (
            <>
              <div><dt>Valor de compra</dt><dd>{formatCurrency(result.purchase_value)}</dd></div>
              <div><dt>Valor de venda</dt><dd>{formatCurrency(result.value)}</dd></div>
              <div><dt>Dias restantes</dt><dd>{result.remaining_days}</dd></div>
              <div><dt>Multa aplicada ({result.penalty_rate}%)</dt><dd>{formatCurrency(result.penalty)}</dd></div>
              <div><dt>Lucro</dt><dd>{formatCurrency(result.profit)}</dd></div>
              <div><dt>Comissão</dt><dd>{formatCurrency(result.fee)}</dd></div>
              <div><dt>Crédito no caixa</dt><dd>{formatCurrency(result.cash_change)}</dd></div>
              <div className="transaction-result__total"><dt>Nova caixa</dt><dd>{formatCurrency(result.club_cash)}</dd></div>
            </>
          ) : (
            <>
              <div><dt>Valor do jogador</dt><dd>{formatCurrency(result.value)}</dd></div>
              <div><dt>Taxa</dt><dd>{formatCurrency(result.fee)}</dd></div>
              <div className="transaction-result__total"><dt>Custo total</dt><dd>{formatCurrency(custoTotal)}</dd></div>
              <div><dt>Fim da fidelidade</dt><dd>{formatDateTimeBrasilia(result.contract.loyalty_until)}</dd></div>
              <div><dt>Nova caixa</dt><dd>{formatCurrency(result.club_cash)}</dd></div>
            </>
          )}
        </dl>

        <button className="transaction-result__done" type="button" onClick={onClose}>Concluir</button>
      </section>
    </div>
  );
}