import { describe, expect, it } from 'vitest';
import { brasiliaDateTimeInputToIso, formatCurrency, formatDateTimeBrasilia } from './formatters';

describe('formatters', () => {
  it('formata valores em reais com duas casas decimais', () => {
    expect(formatCurrency(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });

  it('interpreta datas locais no horário de Brasília', () => {
    expect(brasiliaDateTimeInputToIso('2027-08-10T12:15')).toBe('2027-08-10T12:15-03:00');
    expect(formatDateTimeBrasilia('2027-08-10T12:15:00-03:00')).toBe('10/08/2027, 12:15');
  });

  it('rejeita data/hora local inválida', () => {
    expect(brasiliaDateTimeInputToIso('2027-02-30T12:15')).toBeNull();
  });
});
