import { addMonths, dateInMonth, isValidMonth, monthsInRange } from './dates';
import type { Expense, ExpenseType } from './types';

export function recurringKey(typeId: string, month: string): string {
  return `${typeId}:${month}`;
}

export function readSkipped(settings: Record<string, string>): Set<string> {
  try {
    const parsed = JSON.parse(settings.skippedRecurring || '[]') as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

export function writeSkipped(skipped: Set<string>): string {
  return JSON.stringify([...skipped].sort());
}

/**
 * Meses para los que hay que asegurar recurrentes.
 * Desde la instalación hasta el mes actual, y como mucho un mes hacia adelante.
 * No rellena meses anteriores a la instalación.
 */
export function monthsToEnsure(options: {
  installedMonth: string;
  currentMonth: string;
  viewedMonth?: string | null;
}): string[] {
  const { installedMonth, currentMonth } = options;
  if (!isValidMonth(installedMonth) || !isValidMonth(currentMonth)) return [];
  const cap = addMonths(currentMonth, 1);
  const candidates = [currentMonth];
  if (options.viewedMonth && isValidMonth(options.viewedMonth) && options.viewedMonth <= cap) {
    candidates.push(options.viewedMonth);
  }
  const end = candidates.sort().at(-1) ?? currentMonth;
  if (end < installedMonth) return [];
  return monthsInRange(installedMonth, end);
}

export function planRecurring(options: {
  types: ExpenseType[];
  expenses: Expense[];
  months: string[];
  skipped: Set<string>;
  now: string;
  createId: () => string;
}): Expense[] {
  const existing = new Set(
    options.expenses
      .filter((expense) => expense.recurringTypeId && expense.recurringMonth)
      .map((expense) => recurringKey(expense.recurringTypeId as string, expense.recurringMonth as string)),
  );
  const created: Expense[] = [];
  const reserved = new Set(existing);

  for (const month of options.months) {
    if (!isValidMonth(month)) continue;
    for (const type of options.types) {
      if (!type.recurring || type.archived) continue;
      const typeMonth = type.createdAt.slice(0, 7);
      if (isValidMonth(typeMonth) && month < typeMonth) continue;
      const key = recurringKey(type.id, month);
      if (reserved.has(key) || options.skipped.has(key)) continue;
      reserved.add(key);
      const day = type.recurringDay ?? 1;
      created.push({
        id: options.createId(),
        amount: type.recurringAmount ?? 0,
        date: dateInMonth(month, day),
        description: type.name,
        note: 'Estimado recurrente. Confirma el monto real.',
        receiptPhotoId: null,
        scope: 'personal',
        typeId: type.id,
        projectId: null,
        status: 'por_confirmar',
        recurringTypeId: type.id,
        recurringMonth: month,
        proformaId: null,
        createdAt: options.now,
      });
    }
  }

  return created;
}
