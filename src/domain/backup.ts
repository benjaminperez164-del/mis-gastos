import { emptyData, type AppData, type BackupFile, type Expense, type ExpenseType, type Payment, type Photo, type Proforma, type Project } from './types';

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

export function exportBackup(data: AppData, exportedAt: string): BackupFile {
  return {
    app: 'mis-gastos',
    version: 1,
    exportedAt,
    currency: 'USD',
    data: {
      types: data.types.map((item) => ({ ...item })),
      projects: data.projects.map((item) => ({ ...item })),
      expenses: data.expenses.map((item) => ({ ...item })),
      proformas: data.proformas.map((item) => ({ ...item })),
      payments: data.payments.map((item) => ({ ...item })),
      photos: data.photos.map((item) => ({ ...item })),
      settings: { ...data.settings },
    },
  };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BackupError('El respaldo está incompleto o dañado.');
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value == null) return null;
  if (typeof value !== 'string') throw new BackupError('El respaldo está incompleto o dañado.');
  return value;
}

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BackupError('El respaldo está incompleto o dañado.');
  }
  return value;
}

function optionalNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BackupError('El respaldo está incompleto o dañado.');
  }
  return value;
}

function requireBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') throw new BackupError('El respaldo está incompleto o dañado.');
  return value;
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new BackupError('El respaldo está incompleto o dañado.');
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new BackupError('El respaldo está incompleto o dañado.');
  return value.map((item) => {
    if (!isRecord(item)) throw new BackupError('El respaldo está incompleto o dañado.');
    return item;
  });
}

function parseType(record: Record<string, unknown>): ExpenseType {
  return {
    id: requireString(record, 'id'),
    name: requireString(record, 'name'),
    budget: optionalNumber(record, 'budget'),
    recurring: requireBoolean(record, 'recurring'),
    recurringAmount: optionalNumber(record, 'recurringAmount'),
    recurringDay: optionalNumber(record, 'recurringDay'),
    archived: requireBoolean(record, 'archived'),
    createdAt: requireString(record, 'createdAt'),
  };
}

function parseProject(record: Record<string, unknown>): Project {
  return {
    id: requireString(record, 'id'),
    name: requireString(record, 'name'),
    budget: optionalNumber(record, 'budget'),
    status: oneOf(requireString(record, 'status'), ['activo', 'cerrado'] as const),
    createdAt: requireString(record, 'createdAt'),
  };
}

function parseExpense(record: Record<string, unknown>): Expense {
  return {
    id: requireString(record, 'id'),
    amount: requireNumber(record, 'amount'),
    date: requireString(record, 'date'),
    description: requireString(record, 'description'),
    note: optionalString(record, 'note'),
    receiptPhotoId: optionalString(record, 'receiptPhotoId'),
    scope: oneOf(requireString(record, 'scope'), ['personal', 'proyecto'] as const),
    typeId: optionalString(record, 'typeId'),
    projectId: optionalString(record, 'projectId'),
    status: oneOf(requireString(record, 'status'), ['confirmado', 'por_confirmar'] as const),
    recurringTypeId: optionalString(record, 'recurringTypeId'),
    recurringMonth: optionalString(record, 'recurringMonth'),
    proformaId: optionalString(record, 'proformaId'),
    createdAt: requireString(record, 'createdAt'),
  };
}

function parseProforma(record: Record<string, unknown>): Proforma {
  return {
    id: requireString(record, 'id'),
    projectId: requireString(record, 'projectId'),
    supplier: requireString(record, 'supplier'),
    description: requireString(record, 'description'),
    amount: requireNumber(record, 'amount'),
    attachmentPhotoId: optionalString(record, 'attachmentPhotoId'),
    status: oneOf(requireString(record, 'status'), ['pendiente', 'aprobada', 'rechazada'] as const),
    createdAt: requireString(record, 'createdAt'),
  };
}

function parsePayment(record: Record<string, unknown>): Payment {
  return {
    id: requireString(record, 'id'),
    proformaId: requireString(record, 'proformaId'),
    expenseId: requireString(record, 'expenseId'),
    amount: requireNumber(record, 'amount'),
    date: requireString(record, 'date'),
    note: optionalString(record, 'note'),
    createdAt: requireString(record, 'createdAt'),
  };
}

function parsePhoto(record: Record<string, unknown>): Photo {
  return {
    id: requireString(record, 'id'),
    mime: requireString(record, 'mime'),
    dataBase64: requireString(record, 'dataBase64'),
    createdAt: requireString(record, 'createdAt'),
  };
}

export function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupError('El archivo no es un respaldo de Mis Gastos.');
  }
  if (!isRecord(parsed)) throw new BackupError('El archivo no es un respaldo de Mis Gastos.');
  if (parsed.app !== 'mis-gastos') throw new BackupError('El archivo no es un respaldo de Mis Gastos.');
  if (parsed.version !== 1) throw new BackupError('La versión del respaldo no es compatible.');
  if (parsed.currency !== 'USD') throw new BackupError('El respaldo está incompleto o dañado.');
  if (typeof parsed.exportedAt !== 'string') throw new BackupError('El respaldo está incompleto o dañado.');
  if (!isRecord(parsed.data)) throw new BackupError('El respaldo está incompleto o dañado.');

  const data = parsed.data;
  const settingsIn = data.settings;
  const settings: Record<string, string> = {};
  if (!isRecord(settingsIn)) throw new BackupError('El respaldo está incompleto o dañado.');
  for (const [key, value] of Object.entries(settingsIn)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (typeof value !== 'string') throw new BackupError('El respaldo está incompleto o dañado.');
    settings[key] = value;
  }

  const appData: AppData = {
    ...emptyData(),
    types: asArray(data.types).map(parseType),
    projects: asArray(data.projects).map(parseProject),
    expenses: asArray(data.expenses).map(parseExpense),
    proformas: asArray(data.proformas).map(parseProforma),
    payments: asArray(data.payments).map(parsePayment),
    photos: asArray(data.photos).map(parsePhoto),
    settings,
  };

  return {
    app: 'mis-gastos',
    version: 1,
    exportedAt: parsed.exportedAt,
    currency: 'USD',
    data: appData,
  };
}
