export const formatCurrencyBRL = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercent = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const data = new Date(value);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleString('pt-BR');
};
