export type Scope = 'personal' | 'proyecto';
export type ExpenseStatus = 'confirmado' | 'por_confirmar';
export type ProjectStatus = 'activo' | 'cerrado';
export type ProformaStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface ExpenseType {
  id: string;
  name: string;
  /** Presupuesto mensual opcional, solo para gastos personales. */
  budget: number | null;
  recurring: boolean;
  recurringAmount: number | null;
  /** Día del mes (1-31). Se ajusta al último día si el mes es más corto. */
  recurringDay: number | null;
  archived: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  /** Presupuesto total del proyecto, no mensual. */
  budget: number | null;
  status: ProjectStatus;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  /** Fecha calendario YYYY-MM-DD, pasada o futura. */
  date: string;
  description: string;
  note: string | null;
  receiptPhotoId: string | null;
  scope: Scope;
  typeId: string | null;
  projectId: string | null;
  status: ExpenseStatus;
  recurringTypeId: string | null;
  /** YYYY-MM. Junto con recurringTypeId hace idempotente la generación. */
  recurringMonth: string | null;
  proformaId: string | null;
  createdAt: string;
}

export interface Proforma {
  id: string;
  projectId: string;
  supplier: string;
  description: string;
  amount: number;
  attachmentPhotoId: string | null;
  status: ProformaStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  proformaId: string;
  expenseId: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  mime: string;
  dataBase64: string;
  createdAt: string;
}

export interface AppData {
  types: ExpenseType[];
  projects: Project[];
  expenses: Expense[];
  proformas: Proforma[];
  payments: Payment[];
  photos: Photo[];
  settings: Record<string, string>;
}

export interface BackupFile {
  app: 'mis-gastos';
  version: 1;
  exportedAt: string;
  currency: 'USD';
  data: AppData;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T>(error: string): Result<T> {
  return { ok: false, error };
}

export function emptyData(): AppData {
  return {
    types: [],
    projects: [],
    expenses: [],
    proformas: [],
    payments: [],
    photos: [],
    settings: {},
  };
}
