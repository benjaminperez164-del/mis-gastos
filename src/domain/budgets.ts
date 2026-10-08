import { monthOf } from './dates';
import { roundMoney, sumMoney } from './money';
import type { Expense, ExpenseType, Project } from './types';

export type BudgetLevel = 'none' | 'ok' | 'warning' | 'exceeded';

/** Porcentaje 0-1+. Null si no hay presupuesto. */
export function budgetPercent(spent: number, budget: number | null): number | null {
  if (budget == null) return null;
  if (budget <= 0) return null;
  return spent / budget;
}

export function budgetLevel(spent: number, budget: number | null): BudgetLevel {
  const percent = budgetPercent(spent, budget);
  if (percent == null) return 'none';
  if (percent >= 1) return 'exceeded';
  if (percent >= 0.8) return 'warning';
  return 'ok';
}

export function formatPercent(percent: number): string {
  return `${Math.round(percent * 100)}%`;
}

export function spentForPersonalType(expenses: Expense[], typeId: string, month: string): number {
  return sumMoney(
    expenses
      .filter(
        (expense) =>
          expense.status === 'confirmado' &&
          expense.scope === 'personal' &&
          expense.typeId === typeId &&
          monthOf(expense.date) === month,
      )
      .map((expense) => expense.amount),
  );
}

export function spentForProject(expenses: Expense[], projectId: string): number {
  return sumMoney(
    expenses
      .filter(
        (expense) =>
          expense.status === 'confirmado' && expense.scope === 'proyecto' && expense.projectId === projectId,
      )
      .map((expense) => expense.amount),
  );
}

export interface BudgetAlert {
  type: ExpenseType;
  spent: number;
  percent: number;
  level: 'warning' | 'exceeded';
}

export function personalBudgetAlerts(types: ExpenseType[], expenses: Expense[], month: string): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  for (const type of types) {
    if (type.archived || type.budget == null) continue;
    const spent = spentForPersonalType(expenses, type.id, month);
    const level = budgetLevel(spent, type.budget);
    const percent = budgetPercent(spent, type.budget);
    if ((level === 'warning' || level === 'exceeded') && percent != null) {
      alerts.push({ type, spent: roundMoney(spent), percent, level });
    }
  }
  return alerts;
}

export interface ProjectBudgetView {
  project: Project;
  spent: number;
  percent: number | null;
  level: BudgetLevel;
}

export function projectBudgetView(project: Project, expenses: Expense[]): ProjectBudgetView {
  const spent = spentForProject(expenses, project.id);
  return {
    project,
    spent,
    percent: budgetPercent(spent, project.budget),
    level: budgetLevel(spent, project.budget),
  };
}
