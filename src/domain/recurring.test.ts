import { describe, expect, it } from 'vitest';
import { daysInMonth } from './dates';
import { monthsToEnsure, planRecurring, recurringKey } from './recurring';
import type { Expense, ExpenseType } from './types';

function type(partial: Partial<ExpenseType> & Pick<ExpenseType, 'id' | 'name'>): ExpenseType {
  return {
    budget: null,
    recurring: false,
    recurringAmount: null,
    recurringDay: null,
    archived: false,
    createdAt: '2026-10-01',
    ...partial,
  };
}

describe('generación recurrente', () => {
  const vivienda = type({
    id: 'vivienda',
    name: 'Vivienda',
    recurring: true,
    recurringAmount: 400,
    recurringDay: 31,
    createdAt: '2026-01-15',
  });
  const comida = type({ id: 'comida', name: 'Alimentación', createdAt: '2026-01-01' });
  const archivo = type({
    id: 'viejo',
    name: 'Viejo',
    recurring: true,
    recurringAmount: 10,
    recurringDay: 1,
    archived: true,
    createdAt: '2026-01-01',
  });

  it('crea pendientes y no los duplica al repetir la generación', () => {
    const first = planRecurring({
      types: [vivienda, comida, archivo],
      expenses: [],
      months: ['2026-10'],
      skipped: new Set(),
      now: '2026-10-08T00:00:00.000Z',
      createId: (() => {
        let n = 0;
        return () => `e${++n}`;
      })(),
    });
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      status: 'por_confirmar',
      recurringTypeId: 'vivienda',
      recurringMonth: '2026-10',
      scope: 'personal',
      amount: 400,
    });
    const second = planRecurring({
      types: [vivienda, comida, archivo],
      expenses: first,
      months: ['2026-10'],
      skipped: new Set(),
      now: '2026-10-08T00:00:00.000Z',
      createId: () => 'no-debe-usarse',
    });
    expect(second).toEqual([]);
  });

  it('no regenera si el gasto del mes ya fue confirmado', () => {
    const confirmed: Expense = {
      id: 'ya',
      amount: 380,
      date: '2026-10-31',
      description: 'Vivienda',
      note: null,
      receiptPhotoId: null,
      scope: 'personal',
      typeId: 'vivienda',
      projectId: null,
      status: 'confirmado',
      recurringTypeId: 'vivienda',
      recurringMonth: '2026-10',
      proformaId: null,
      createdAt: '2026-10-02',
    };
    const planned = planRecurring({
      types: [vivienda],
      expenses: [confirmed],
      months: ['2026-10'],
      skipped: new Set(),
      now: '2026-10-08',
      createId: () => 'nuevo',
    });
    expect(planned).toEqual([]);
  });

  it('ajusta el día 31 a febrero y respeta el bisiesto', () => {
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2028-02')).toBe(29);
    const february = planRecurring({
      types: [vivienda],
      expenses: [],
      months: ['2026-02', '2028-02'],
      skipped: new Set(),
      now: '2026-02-01',
      createId: (() => {
        let n = 0;
        return () => `f${++n}`;
      })(),
    });
    expect(february.map((item) => item.date)).toEqual(['2026-02-28', '2028-02-29']);
  });

  it('no genera meses anteriores a la creación del tipo ni claves omitidas', () => {
    const planned = planRecurring({
      types: [vivienda],
      expenses: [],
      months: ['2025-12', '2026-01'],
      skipped: new Set([recurringKey('vivienda', '2026-01')]),
      now: '2026-01-02',
      createId: () => 'x',
    });
    expect(planned).toEqual([]);
  });

  it('al ponerse al día genera cada mes una sola vez y no rellena antes de instalar', () => {
    expect(
      monthsToEnsure({
        installedMonth: '2026-08',
        currentMonth: '2026-10',
        viewedMonth: null,
      }),
    ).toEqual(['2026-08', '2026-09', '2026-10']);

    expect(
      monthsToEnsure({
        installedMonth: '2026-10',
        currentMonth: '2026-10',
        viewedMonth: '2020-01',
      }),
    ).toEqual(['2026-10']);

    expect(
      monthsToEnsure({
        installedMonth: '2026-10',
        currentMonth: '2026-10',
        viewedMonth: '2026-11',
      }),
    ).toEqual(['2026-10', '2026-11']);

    expect(
      monthsToEnsure({
        installedMonth: '2026-10',
        currentMonth: '2026-10',
        viewedMonth: '2030-01',
      }),
    ).toEqual(['2026-10']);

    const months = monthsToEnsure({
      installedMonth: '2026-08',
      currentMonth: '2026-10',
    });
    const once = planRecurring({
      types: [vivienda],
      expenses: [],
      months,
      skipped: new Set(),
      now: '2026-10-01',
      createId: (() => {
        let n = 0;
        return () => `m${++n}`;
      })(),
    });
    expect(once.map((item) => item.recurringMonth)).toEqual(['2026-08', '2026-09', '2026-10']);
    const again = planRecurring({
      types: [vivienda],
      expenses: once,
      months,
      skipped: new Set(),
      now: '2026-10-01',
      createId: () => 'no',
    });
    expect(again).toEqual([]);
  });
});
