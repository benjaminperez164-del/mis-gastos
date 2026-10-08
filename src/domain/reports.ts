import { monthOf } from './dates';
import { sumMoney } from './money';
import type { Expense, ExpenseType, Project } from './types';

export interface NamedTotal {
  id: string;
  label: string;
  total: number;
}

export interface MonthSplit {
  month: string;
  personal: number;
  project: number;
  total: number;
}

function confirmed(expenses: Expense[], month: string | null): Expense[] {
  return expenses.filter((expense) => expense.status === 'confirmado' && (month == null || monthOf(expense.date) === month));
}

export function totalsByMonth(expenses: Expense[], months: string[]): MonthSplit[] {
  return months.map((month) => {
    const rows = confirmed(expenses, month);
    const personal = sumMoney(rows.filter((expense) => expense.scope === 'personal').map((expense) => expense.amount));
    const project = sumMoney(rows.filter((expense) => expense.scope === 'proyecto').map((expense) => expense.amount));
    return { month, personal, project, total: sumMoney([personal, project]) };
  });
}

export function totalsByType(expenses: Expense[], types: ExpenseType[], month: string): NamedTotal[] {
  const rows = confirmed(expenses, month);
  const totals = new Map<string, number>();
  for (const expense of rows) {
    const key = expense.typeId ?? 'sin_tipo';
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }
  const named: NamedTotal[] = [];
  for (const type of types) {
    const total = totals.get(type.id);
    if (total) named.push({ id: type.id, label: type.name, total: sumMoney([total]) });
  }
  const untyped = totals.get('sin_tipo');
  if (untyped) named.push({ id: 'sin_tipo', label: 'Sin tipo', total: sumMoney([untyped]) });
  return named.sort((a, b) => b.total - a.total);
}

export function totalsByProject(expenses: Expense[], projects: Project[], month: string | null): NamedTotal[] {
  const rows = confirmed(expenses, month).filter((expense) => expense.scope === 'proyecto' && expense.projectId);
  const totals = new Map<string, number>();
  for (const expense of rows) {
    const key = expense.projectId as string;
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }
  return projects
    .map((project) => ({
      id: project.id,
      label: project.name,
      total: sumMoney([totals.get(project.id) ?? 0]),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function projectMonthBreakdown(expenses: Expense[], projectId: string): { month: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.status !== 'confirmado' || expense.projectId !== projectId) continue;
    const month = monthOf(expense.date);
    totals.set(month, (totals.get(month) ?? 0) + expense.amount);
  }
  return [...totals.entries()]
    .map(([month, total]) => ({ month, total: sumMoney([total]) }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}

export function projectTypeBreakdown(expenses: Expense[], types: ExpenseType[], projectId: string): NamedTotal[] {
  const rows = expenses.filter((expense) => expense.status === 'confirmado' && expense.projectId === projectId);
  const totals = new Map<string, number>();
  for (const expense of rows) {
    const key = expense.typeId ?? 'sin_tipo';
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }
  const named: NamedTotal[] = [];
  for (const type of types) {
    const total = totals.get(type.id);
    if (total) named.push({ id: type.id, label: type.name, total: sumMoney([total]) });
  }
  const untyped = totals.get('sin_tipo');
  if (untyped) named.push({ id: 'sin_tipo', label: 'Sin tipo', total: sumMoney([untyped]) });
  return named.sort((a, b) => b.total - a.total);
}
