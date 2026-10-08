export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100);
}

export function roundMoney(amount: number): number {
  return toCents(amount) / 100;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(amount));
}

export function formatAmountInput(amount: number): string {
  return roundMoney(amount).toFixed(2);
}

/**
 * Acepta 12.50, 12,50 y 1.240,50 (formato de Ecuador).
 * Un punto con grupos de tres dígitos se lee como separador de miles.
 */
export function parseAmount(input: string): number | null {
  const trimmed = input.trim().replace(/\s/g, '').replace(/\$/g, '');
  if (!trimmed) return null;
  let normalized = trimmed;
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, '');
  } else if (trimmed.includes(',')) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return roundMoney(value);
}

export function sumMoney(amounts: number[]): number {
  return roundMoney(amounts.reduce((total, amount) => total + amount, 0));
}
