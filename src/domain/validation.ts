import { isValidDate } from './dates';
import { roundMoney, toCents } from './money';
import { fail, ok, type AppData, type Expense, type ExpenseType, type Project, type Proforma, type Result, type Scope } from './types';

export interface ExpenseDraft {
  id?: string;
  amount: number;
  date: string;
  description: string;
  note: string | null;
  receiptPhotoId: string | null;
  scope: Scope;
  typeId: string | null;
  projectId: string | null;
  confirm?: boolean;
}

export function validateExpense(draft: ExpenseDraft, data: AppData, now: string): Result<Expense> {
  const description = draft.description.trim();
  if (!description) return fail('descripcion_requerida');
  if (!isValidDate(draft.date)) return fail('fecha_invalida');
  const existing = draft.id ? data.expenses.find((expense) => expense.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('no_encontrado');

  const status = existing?.status === 'por_confirmar' && !draft.confirm ? 'por_confirmar' : 'confirmado';
  if (status === 'confirmado') {
    if (!Number.isFinite(draft.amount) || toCents(draft.amount) <= 0) return fail('monto_invalido');
  } else if (!Number.isFinite(draft.amount) || draft.amount < 0) {
    return fail('monto_invalido');
  }

  let typeId = draft.typeId;
  let projectId = draft.projectId;
  if (draft.scope === 'personal') {
    projectId = null;
    if (!typeId) return fail('tipo_requerido');
    const type = data.types.find((item) => item.id === typeId);
    if (!type) return fail('tipo_invalido');
    if (type.archived && existing?.typeId !== type.id) return fail('tipo_invalido');
  } else {
    if (!projectId) return fail('proyecto_requerido');
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return fail('proyecto_invalido');
    if (typeId) {
      const type = data.types.find((item) => item.id === typeId);
      if (!type) return fail('tipo_invalido');
    } else {
      typeId = null;
    }
  }

  const expense: Expense = {
    id: existing?.id ?? '',
    amount: roundMoney(draft.amount),
    date: draft.date,
    description,
    note: draft.note?.trim() || null,
    receiptPhotoId: draft.receiptPhotoId,
    scope: draft.scope,
    typeId,
    projectId,
    status,
    recurringTypeId: existing?.recurringTypeId ?? null,
    recurringMonth: existing?.recurringMonth ?? null,
    proformaId: existing?.proformaId ?? null,
    createdAt: existing?.createdAt ?? now,
  };
  return ok(expense);
}

export interface TypeDraft {
  id?: string;
  name: string;
  budget: number | null;
  recurring: boolean;
  recurringAmount: number | null;
  recurringDay: number | null;
}

export function validateType(draft: TypeDraft, data: AppData, now: string): Result<ExpenseType> {
  const name = draft.name.trim();
  if (!name) return fail('nombre_requerido');
  const duplicate = data.types.find(
    (type) => type.id !== draft.id && type.name.localeCompare(name, 'es', { sensitivity: 'accent' }) === 0,
  );
  if (duplicate) return fail('nombre_duplicado');
  if (draft.budget != null && (!Number.isFinite(draft.budget) || draft.budget <= 0)) return fail('presupuesto_invalido');
  if (draft.recurring) {
    if (draft.recurringAmount != null && (!Number.isFinite(draft.recurringAmount) || draft.recurringAmount < 0)) {
      return fail('monto_invalido');
    }
    if (
      draft.recurringDay == null ||
      !Number.isInteger(draft.recurringDay) ||
      draft.recurringDay < 1 ||
      draft.recurringDay > 31
    ) {
      return fail('dia_invalido');
    }
  }
  const existing = draft.id ? data.types.find((type) => type.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('no_encontrado');
  return ok({
    id: existing?.id ?? '',
    name,
    budget: draft.budget == null ? null : roundMoney(draft.budget),
    recurring: draft.recurring,
    recurringAmount: draft.recurringAmount == null ? null : roundMoney(draft.recurringAmount),
    recurringDay: draft.recurringDay,
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
  });
}

export interface ProjectDraft {
  id?: string;
  name: string;
  budget: number | null;
  status?: Project['status'];
}

export function validateProject(draft: ProjectDraft, data: AppData, now: string): Result<Project> {
  const name = draft.name.trim();
  if (!name) return fail('nombre_requerido');
  if (draft.budget != null && (!Number.isFinite(draft.budget) || draft.budget <= 0)) return fail('presupuesto_invalido');
  const existing = draft.id ? data.projects.find((project) => project.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('no_encontrado');
  return ok({
    id: existing?.id ?? '',
    name,
    budget: draft.budget == null ? null : roundMoney(draft.budget),
    status: draft.status ?? existing?.status ?? 'activo',
    createdAt: existing?.createdAt ?? now,
  });
}

export interface ProformaDraft {
  id?: string;
  projectId: string;
  supplier: string;
  description: string;
  amount: number;
  attachmentPhotoId: string | null;
}

export function validateProforma(draft: ProformaDraft, data: AppData, now: string): Result<Proforma> {
  const supplier = draft.supplier.trim();
  const description = draft.description.trim();
  if (!supplier) return fail('proveedor_requerido');
  if (!description) return fail('descripcion_requerida');
  if (!Number.isFinite(draft.amount) || toCents(draft.amount) <= 0) return fail('monto_invalido');
  if (!data.projects.some((project) => project.id === draft.projectId)) return fail('proyecto_invalido');
  const existing = draft.id ? data.proformas.find((proforma) => proforma.id === draft.id) : undefined;
  if (draft.id && !existing) return fail('no_encontrado');
  if (existing && existing.status !== 'pendiente') return fail('no_editable');
  return ok({
    id: existing?.id ?? '',
    projectId: draft.projectId,
    supplier,
    description,
    amount: roundMoney(draft.amount),
    attachmentPhotoId: draft.attachmentPhotoId,
    status: existing?.status ?? 'pendiente',
    createdAt: existing?.createdAt ?? now,
  });
}
