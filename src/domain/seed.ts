import { currentMonth, todayISO } from './dates';
import { emptyData, type AppData, type ExpenseType } from './types';

export interface TypeSeed {
  name: string;
  budget: number | null;
  recurring?: boolean;
  recurringAmount?: number | null;
  recurringDay?: number | null;
}

export const DEFAULT_TYPES: TypeSeed[] = [
  { name: 'Alimentación', budget: 300 },
  { name: 'Medicina', budget: 80 },
  { name: 'Transporte', budget: 60 },
  { name: 'Vivienda', budget: 400, recurring: true, recurringAmount: 400, recurringDay: 1 },
  { name: 'Servicios', budget: 50, recurring: true, recurringAmount: 45, recurringDay: 5 },
  { name: 'Educación', budget: null },
  { name: 'Entretenimiento', budget: 40 },
  { name: 'Otros', budget: null },
];

export function seedData(now: Date, createId: () => string): AppData {
  const createdAt = todayISO(now);
  const data = emptyData();
  data.types = DEFAULT_TYPES.map(
    (seed): ExpenseType => ({
      id: createId(),
      name: seed.name,
      budget: seed.budget,
      recurring: Boolean(seed.recurring),
      recurringAmount: seed.recurringAmount ?? null,
      recurringDay: seed.recurringDay ?? null,
      archived: false,
      createdAt,
    }),
  );
  data.settings = {
    installedMonth: currentMonth(now),
    installedAt: now.toISOString(),
    lastClosedMonth: currentMonth(now),
    skippedRecurring: '[]',
  };
  return data;
}
