import { describe, expect, it } from 'vitest';
import { budgetLevel, budgetPercent, personalBudgetAlerts, projectBudgetView, spentForPersonalType } from './budgets';
import type { Expense, ExpenseType, Project } from './types';

function expense(partial: Partial<Expense> & Pick<Expense, 'id' | 'amount' | 'date'>): Expense {
  return {
    description: 'Gasto',
    note: null,
    receiptPhotoId: null,
    scope: 'personal',
    typeId: 'comida',
    projectId: null,
    status: 'confirmado',
    recurringTypeId: null,
    recurringMonth: null,
    proformaId: null,
    createdAt: partial.date,
    ...partial,
  };
}

const comida: ExpenseType = {
  id: 'comida',
  name: 'Alimentación',
  budget: 100,
  recurring: false,
  recurringAmount: null,
  recurringDay: null,
  archived: false,
  createdAt: '2026-10-01',
};

describe('presupuestos', () => {
  it('calcula el porcentaje y los umbrales de 80% y superado', () => {
    expect(budgetPercent(0, null)).toBeNull();
    expect(budgetLevel(0, null)).toBe('none');
    expect(budgetLevel(79, 100)).toBe('ok');
    expect(budgetPercent(79, 100)).toBeCloseTo(0.79);
    expect(budgetLevel(80, 100)).toBe('warning');
    expect(budgetLevel(100, 100)).toBe('exceeded');
    expect(budgetLevel(120, 100)).toBe('exceeded');
  });

  it('el presupuesto de un tipo es mensual y no cuenta pendientes ni gastos de proyecto', () => {
    const expenses = [
      expense({ id: '1', amount: 70, date: '2026-10-02' }),
      expense({ id: '2', amount: 50, date: '2026-10-03', status: 'por_confirmar' }),
      expense({ id: '3', amount: 40, date: '2026-09-03' }),
      expense({ id: '4', amount: 30, date: '2026-10-04', scope: 'proyecto', projectId: 'obra' }),
    ];
    expect(spentForPersonalType(expenses, 'comida', '2026-10')).toBe(70);
    expect(personalBudgetAlerts([comida], expenses, '2026-10')).toEqual([]);
    const over = personalBudgetAlerts(
      [comida],
      [...expenses, expense({ id: '5', amount: 20, date: '2026-10-05' })],
      '2026-10',
    );
    expect(over[0]?.level).toBe('warning');
    expect(over[0]?.spent).toBe(90);
    const exceeded = personalBudgetAlerts(
      [comida],
      [expense({ id: '6', amount: 130, date: '2026-10-01' })],
      '2026-10',
    );
    expect(exceeded[0]?.level).toBe('exceeded');
  });

  it('el presupuesto de un proyecto acumula todos los meses', () => {
    const project: Project = {
      id: 'obra',
      name: 'Cocina',
      budget: 1000,
      status: 'activo',
      createdAt: '2026-01-01',
    };
    const expenses = [
      expense({ id: '1', amount: 400, date: '2026-01-10', scope: 'proyecto', projectId: 'obra', typeId: null }),
      expense({ id: '2', amount: 450, date: '2026-08-10', scope: 'proyecto', projectId: 'obra', typeId: null }),
      expense({ id: '3', amount: 100, date: '2026-08-11', scope: 'proyecto', projectId: 'obra', status: 'por_confirmar' }),
    ];
    const view = projectBudgetView(project, expenses);
    expect(view.spent).toBe(850);
    expect(view.level).toBe('warning');
    expect(view.percent).toBeCloseTo(0.85);
  });
});
