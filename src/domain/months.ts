import { sumMoney } from './money';
import { monthOf } from './dates';
import type { Expense } from './types';

export interface MonthSummary {
  month: string;
  confirmedTotal: number;
  personalTotal: number;
  projectTotal: number;
  pending: Expense[];
  confirmed: Expense[];
}

/** Un mes no se guarda: es la vista de los gastos cuya fecha cae en ese mes. */
export function expensesInMonth(expenses: Expense[], month: string): Expense[] {
  return expenses
    .filter((expense) => monthOf(expense.date) === month)
    .slice()
    .sort(compareExpenses);
}

export function summarizeMonth(expenses: Expense[], month: string): MonthSummary {
  const inMonth = expensesInMonth(expenses, month);
  const confirmed = inMonth.filter((expense) => expense.status === 'confirmado');
  const pending = inMonth.filter((expense) => expense.status === 'por_confirmar');
  const personal = confirmed.filter((expense) => expense.scope === 'personal');
  const projects = confirmed.filter((expense) => expense.scope === 'proyecto');
  return {
    month,
    confirmedTotal: sumMoney(confirmed.map((expense) => expense.amount)),
    personalTotal: sumMoney(personal.map((expense) => expense.amount)),
    projectTotal: sumMoney(projects.map((expense) => expense.amount)),
    pending,
    confirmed,
  };
}

export function compareExpenses(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? 1 : -1;
}
