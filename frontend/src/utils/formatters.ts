const brasiliaTimeZone = 'America/Sao_Paulo';
const brasiliaOffset = '-03:00';

export type DateInput = Date | number | string | null | undefined;

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';

  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return '—';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function parseDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(' ', 'T');
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized);
    const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(normalized);

    if (dateOnly) {
      const parsed = new Date(`${normalized}T12:00:00${brasiliaOffset}`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (localDateTime) {
      const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
      const parsed = new Date(`${withSeconds}${brasiliaOffset}`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateBrasilia(value: DateInput): string {
  const date = parseDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: brasiliaTimeZone,
    dateStyle: 'short',
  }).format(date);
}

export function formatDateTimeBrasilia(value: DateInput): string {
  const date = parseDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: brasiliaTimeZone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function brasiliaDateTimeInputToIso(value: string): string | null {
  const date = parseDate(value);
  if (!date || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: brasiliaTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));

  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}${brasiliaOffset}`;
}