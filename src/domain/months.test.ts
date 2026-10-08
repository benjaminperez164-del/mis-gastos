import { describe, expect, it } from 'vitest';
import { summarizeMonth } from './months';
import type { Expense } from './types';

function expense(partial: Partial<Expense> & Pick<Expense, 'id' | 'date' | 'amount' | 'scope'>): Expense {
  return {
    description: partial.description ?? 'Gasto',
    note: null,
    receiptPhotoId: null,
    typeId: partial.typeId ?? null,
    projectId: partial.projectId ?? null,
    status: partial.status ?? 'confirmado',
    recurringTypeId: null,
    recurringMonth: null,
    proformaId: null,
    createdAt: partial.createdAt ?? partial.date,
    ...partial,
  };
}

describe('vistas de mes', () => {
  const expenses = [
    expense({ id: '1', date: '2026-10-02', amount: 10, scope: 'personal', typeId: 'comida' }),
    expense({ id: '2', date: '2026-09-30', amount: 99, scope: 'personal' }),
    expense({ id: '3', date: '2026-11-01', amount: 40, scope: 'proyecto', projectId: 'obra' }),
    expense({
      id: '4',
      date: '2026-10-15',
      amount: 80,
      scope: 'personal',
      status: 'por_confirmar',
    }),
    expense({ id: '5', date: '2024-01-01', amount: 5, scope: 'proyecto', projectId: 'obra' }),
    expense({ id: '6', date: '2030-06-20', amount: 7, scope: 'personal' }),
  ];

  it('deriva el mes desde la fecha y no mezcla otros meses', () => {
    const october = summarizeMonth(expenses, '2026-10');
    expect(october.confirmed.map((item) => item.id)).toEqual(['1']);
    expect(october.pending.map((item) => item.id)).toEqual(['4']);
    expect(summarizeMonth(expenses, '2026-09').confirmedTotal).toBe(99);
    expect(summarizeMonth(expenses, '2026-11').projectTotal).toBe(40);
  });

  it('acepta fechas pasadas y futuras', () => {
    expect(summarizeMonth(expenses, '2024-01').confirmedTotal).toBe(5);
    expect(summarizeMonth(expenses, '2030-06').confirmedTotal).toBe(7);
  });

  it('un mes sin gastos es una vista vacía, no una hoja guardada', () => {
    const empty = summarizeMonth(expenses, '2026-12');
    expect(empty.confirmed).toEqual([]);
    expect(empty.pending).toEqual([]);
    expect(empty.confirmedTotal).toBe(0);
  });

  it('solo los confirmados suman, separados en personal y proyecto', () => {
    const october = summarizeMonth(
      [
        ...expenses,
        expense({ id: '7', date: '2026-10-20', amount: 25, scope: 'proyecto', projectId: 'obra' }),
      ],
      '2026-10',
    );
    expect(october.personalTotal).toBe(10);
    expect(october.projectTotal).toBe(25);
    expect(october.confirmedTotal).toBe(35);
  });
});
