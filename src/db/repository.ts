import { parseBackup } from '@/src/domain/backup';
import { currentMonth } from '@/src/domain/dates';
import { evaluateReminder, type Reminder } from '@/src/domain/reminders';
import { approveProforma, registerPayment, rejectProforma } from '@/src/domain/proformas';
import { planRecurring, readSkipped, recurringKey, writeSkipped, monthsToEnsure } from '@/src/domain/recurring';
import { seedData } from '@/src/domain/seed';
import {
  emptyData,
  fail,
  ok,
  type AppData,
  type BackupFile,
  type ExpenseType,
  type Photo,
  type Project,
  type Proforma,
  type Result,
} from '@/src/domain/types';
import {
  validateExpense,
  validateProforma,
  validateProject,
  validateType,
  type ExpenseDraft,
  type ProformaDraft,
  type ProjectDraft,
  type TypeDraft,
} from '@/src/domain/validation';
import type { PaymentInput } from '@/src/domain/proformas';
import type { Database, StoreName } from './database';

interface SettingRow {
  id: string;
  value: string;
}

interface SnapshotRow {
  id: string;
  key: string;
  file: BackupFile;
}

export interface PendingSnapshot {
  key: string;
  file: BackupFile;
}

function randomId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function dataToRows(data: AppData): { store: StoreName; id: string; value: unknown }[] {
  const rows: { store: StoreName; id: string; value: unknown }[] = [];
  for (const item of data.types) rows.push({ store: 'types', id: item.id, value: item });
  for (const item of data.projects) rows.push({ store: 'projects', id: item.id, value: item });
  for (const item of data.expenses) rows.push({ store: 'expenses', id: item.id, value: item });
  for (const item of data.proformas) rows.push({ store: 'proformas', id: item.id, value: item });
  for (const item of data.payments) rows.push({ store: 'payments', id: item.id, value: item });
  for (const item of data.photos) rows.push({ store: 'photos', id: item.id, value: item });
  for (const [id, value] of Object.entries(data.settings)) {
    rows.push({ store: 'settings', id, value: { id, value } satisfies SettingRow });
  }
  return rows;
}

function storesToData(stores: Record<StoreName, unknown[]>): AppData {
  const settings: Record<string, string> = {};
  for (const row of stores.settings as SettingRow[]) {
    if (row && typeof row.id === 'string' && typeof row.value === 'string') settings[row.id] = row.value;
  }
  return {
    types: stores.types as AppData['types'],
    projects: stores.projects as AppData['projects'],
    expenses: stores.expenses as AppData['expenses'],
    proformas: stores.proformas as AppData['proformas'],
    payments: stores.payments as AppData['payments'],
    photos: stores.photos as AppData['photos'],
    settings,
  };
}

function settingRow(id: string, value: string) {
  return { store: 'settings' as const, id, value: { id, value } satisfies SettingRow };
}

function photoInUse(data: AppData, photoId: string, ignoreExpenseId?: string): boolean {
  return (
    data.expenses.some((expense) => expense.id !== ignoreExpenseId && expense.receiptPhotoId === photoId) ||
    data.proformas.some((proforma) => proforma.attachmentPhotoId === photoId)
  );
}

export function createRepository(db: Database, createId: () => string = randomId) {
  let chain: Promise<unknown> = Promise.resolve();

  function lock<T>(fn: () => Promise<T>): Promise<T> {
    const run = chain.then(fn, fn);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function load(): Promise<AppData> {
    return storesToData(await db.readAll());
  }

  async function ensureUnlocked(data: AppData, now: Date, viewedMonth: string | null): Promise<AppData> {
    const installed = data.settings.installedMonth;
    if (!installed) return data;
    const months = monthsToEnsure({
      installedMonth: installed,
      currentMonth: currentMonth(now),
      viewedMonth,
    });
    const planned = planRecurring({
      types: data.types,
      expenses: data.expenses,
      months,
      skipped: readSkipped(data.settings),
      now: now.toISOString(),
      createId,
    });
    if (planned.length === 0) return data;
    await db.bulkUpsert(planned.map((expense) => ({ store: 'expenses' as const, id: expense.id, value: expense })));
    return { ...data, expenses: [...data.expenses, ...planned] };
  }

  return {
    async initialize(now: Date): Promise<{ data: AppData; reminder: Reminder | null }> {
      return lock(async () => {
        let data = await load();
        if (!data.settings.installedMonth) {
          data = seedData(now, createId);
          await db.replaceAll(dataToRows(data));
        }
        data = await ensureUnlocked(data, now, null);
        return { data, reminder: evaluateReminder(data.settings, now) };
      });
    },

    async ensureMonth(now: Date, viewedMonth: string): Promise<AppData> {
      return lock(async () => ensureUnlocked(await load(), now, viewedMonth));
    },

    async saveExpense(draft: ExpenseDraft, now = new Date()): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const validated = validateExpense(draft, data, now.toISOString());
        if (!validated.ok) return validated;
        const expense = { ...validated.value, id: validated.value.id || createId() };
        const previous = data.expenses.find((item) => item.id === expense.id);
        if (previous?.proformaId) {
          if (Math.round(expense.amount * 100) !== Math.round(previous.amount * 100)) return fail('proforma_bloqueada');
          expense.scope = previous.scope;
          expense.projectId = previous.projectId;
          expense.typeId = previous.typeId;
          expense.proformaId = previous.proformaId;
          expense.status = 'confirmado';
        }
        await db.bulkUpsert([{ store: 'expenses', id: expense.id, value: expense }]);
        let payments = data.payments;
        if (previous?.proformaId && previous.date !== expense.date) {
          const payment = payments.find((item) => item.expenseId === expense.id);
          if (payment) {
            const nextPayment = { ...payment, date: expense.date };
            await db.bulkUpsert([{ store: 'payments', id: payment.id, value: nextPayment }]);
            payments = payments.map((item) => (item.id === payment.id ? nextPayment : item));
          }
        }
        if (previous?.receiptPhotoId && previous.receiptPhotoId !== expense.receiptPhotoId) {
          const next = { ...data, expenses: data.expenses.map((item) => (item.id === expense.id ? expense : item)) };
          if (!photoInUse(next, previous.receiptPhotoId)) await db.remove('photos', previous.receiptPhotoId);
        }
        const expenses = previous
          ? data.expenses.map((item) => (item.id === expense.id ? expense : item))
          : [...data.expenses, expense];
        return ok({ ...data, expenses, payments });
      });
    },

    async deleteExpense(id: string): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const expense = data.expenses.find((item) => item.id === id);
        if (!expense) return ok(data);
        await db.remove('expenses', id);
        const linked = data.payments.filter((payment) => payment.expenseId === id);
        for (const payment of linked) await db.remove('payments', payment.id);
        let settings = data.settings;
        if (expense.recurringTypeId && expense.recurringMonth) {
          const skipped = readSkipped(settings);
          skipped.add(recurringKey(expense.recurringTypeId, expense.recurringMonth));
          settings = { ...settings, skippedRecurring: writeSkipped(skipped) };
          await db.bulkUpsert([settingRow('skippedRecurring', settings.skippedRecurring)]);
        }
        let photos = data.photos;
        if (expense.receiptPhotoId) {
          const nextData = { ...data, expenses: data.expenses.filter((item) => item.id !== id) };
          if (!photoInUse(nextData, expense.receiptPhotoId)) {
            await db.remove('photos', expense.receiptPhotoId);
            photos = photos.filter((photo) => photo.id !== expense.receiptPhotoId);
          }
        }
        return ok({
          ...data,
          expenses: data.expenses.filter((item) => item.id !== id),
          payments: data.payments.filter((payment) => payment.expenseId !== id),
          photos,
          settings,
        });
      });
    },

    async saveType(draft: TypeDraft, now = new Date()): Promise<Result<AppData>> {
      return lock(async () => {
        let data = await load();
        const validated = validateType(draft, data, now.toISOString());
        if (!validated.ok) return validated;
        const type: ExpenseType = { ...validated.value, id: validated.value.id || createId() };
        await db.bulkUpsert([{ store: 'types', id: type.id, value: type }]);
        data = {
          ...data,
          types: data.types.some((item) => item.id === type.id)
            ? data.types.map((item) => (item.id === type.id ? type : item))
            : [...data.types, type],
        };
        data = await ensureUnlocked(data, now, null);
        return ok(data);
      });
    },

    async archiveType(id: string, archived: boolean): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const type = data.types.find((item) => item.id === id);
        if (!type) return fail('no_encontrado');
        const next = { ...type, archived };
        await db.bulkUpsert([{ store: 'types', id, value: next }]);
        return ok({ ...data, types: data.types.map((item) => (item.id === id ? next : item)) });
      });
    },

    async deleteType(id: string): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        if (data.expenses.some((expense) => expense.typeId === id || expense.recurringTypeId === id)) {
          return fail('en_uso');
        }
        await db.remove('types', id);
        return ok({ ...data, types: data.types.filter((type) => type.id !== id) });
      });
    },

    async saveProject(draft: ProjectDraft, now = new Date()): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const validated = validateProject(draft, data, now.toISOString());
        if (!validated.ok) return validated;
        const project: Project = { ...validated.value, id: validated.value.id || createId() };
        await db.bulkUpsert([{ store: 'projects', id: project.id, value: project }]);
        const projects = data.projects.some((item) => item.id === project.id)
          ? data.projects.map((item) => (item.id === project.id ? project : item))
          : [...data.projects, project];
        return ok({ ...data, projects });
      });
    },

    async setProjectStatus(id: string, status: Project['status']): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const project = data.projects.find((item) => item.id === id);
        if (!project) return fail('no_encontrado');
        const next = { ...project, status };
        await db.bulkUpsert([{ store: 'projects', id, value: next }]);
        return ok({ ...data, projects: data.projects.map((item) => (item.id === id ? next : item)) });
      });
    },

    async deleteProject(id: string): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        if (
          data.expenses.some((expense) => expense.projectId === id) ||
          data.proformas.some((proforma) => proforma.projectId === id)
        ) {
          return fail('en_uso');
        }
        await db.remove('projects', id);
        return ok({ ...data, projects: data.projects.filter((project) => project.id !== id) });
      });
    },

    async saveProforma(draft: ProformaDraft, now = new Date()): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const validated = validateProforma(draft, data, now.toISOString());
        if (!validated.ok) return validated;
        const proforma: Proforma = { ...validated.value, id: validated.value.id || createId() };
        await db.bulkUpsert([{ store: 'proformas', id: proforma.id, value: proforma }]);
        const proformas = data.proformas.some((item) => item.id === proforma.id)
          ? data.proformas.map((item) => (item.id === proforma.id ? proforma : item))
          : [...data.proformas, proforma];
        return ok({ ...data, proformas });
      });
    },

    async approveProformaAction(
      id: string,
      initialPayment: PaymentInput | null,
      now = new Date(),
    ): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const proforma = data.proformas.find((item) => item.id === id);
        if (!proforma) return fail('no_encontrado');
        const result = approveProforma({
          proforma,
          payments: data.payments,
          initialPayment,
          now: now.toISOString(),
          createId,
        });
        if (!result.ok) return result;
        const rows: { store: StoreName; id: string; value: unknown }[] = [
          { store: 'proformas', id: result.value.proforma.id, value: result.value.proforma },
        ];
        if (result.value.expense) rows.push({ store: 'expenses', id: result.value.expense.id, value: result.value.expense });
        if (result.value.payment) rows.push({ store: 'payments', id: result.value.payment.id, value: result.value.payment });
        await db.bulkUpsert(rows);
        return ok({
          ...data,
          proformas: data.proformas.map((item) => (item.id === id ? result.value.proforma : item)),
          expenses: result.value.expense ? [...data.expenses, result.value.expense] : data.expenses,
          payments: result.value.payment ? [...data.payments, result.value.payment] : data.payments,
        });
      });
    },

    async addPayment(id: string, payment: PaymentInput, now = new Date()): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const proforma = data.proformas.find((item) => item.id === id);
        if (!proforma) return fail('no_encontrado');
        const result = registerPayment({
          proforma,
          payments: data.payments,
          payment,
          now: now.toISOString(),
          createId,
        });
        if (!result.ok) return result;
        await db.bulkUpsert([
          { store: 'expenses', id: result.value.expense.id, value: result.value.expense },
          { store: 'payments', id: result.value.payment.id, value: result.value.payment },
        ]);
        return ok({
          ...data,
          expenses: [...data.expenses, result.value.expense],
          payments: [...data.payments, result.value.payment],
        });
      });
    },

    async rejectProformaAction(id: string): Promise<Result<AppData>> {
      return lock(async () => {
        const data = await load();
        const proforma = data.proformas.find((item) => item.id === id);
        if (!proforma) return fail('no_encontrado');
        const result = rejectProforma(proforma);
        if (!result.ok) return result;
        await db.bulkUpsert([{ store: 'proformas', id, value: result.value }]);
        return ok({
          ...data,
          proformas: data.proformas.map((item) => (item.id === id ? result.value : item)),
        });
      });
    },

    async addPhoto(input: { mime: string; dataBase64: string }, now = new Date()): Promise<Result<{ data: AppData; id: string }>> {
      return lock(async () => {
        const data = await load();
        const photo: Photo = {
          id: createId(),
          mime: input.mime,
          dataBase64: input.dataBase64,
          createdAt: now.toISOString(),
        };
        await db.bulkUpsert([{ store: 'photos', id: photo.id, value: photo }]);
        return ok({ data: { ...data, photos: [...data.photos, photo] }, id: photo.id });
      });
    },

    async getPendingSnapshot(): Promise<PendingSnapshot | null> {
      const stores = await db.readAll();
      const row = (stores.snapshots as SnapshotRow[]).find((item) => item?.id === 'pending');
      if (!row?.file) return null;
      return { key: row.key, file: row.file };
    },

    async setPendingSnapshot(key: string, file: BackupFile): Promise<void> {
      const row: SnapshotRow = { id: 'pending', key, file };
      await db.bulkUpsert([{ store: 'snapshots', id: 'pending', value: row }]);
    },

    async markBackedUp(now: Date): Promise<{ data: AppData; reminder: Reminder | null }> {
      return lock(async () => {
        const data = await load();
        const settings = {
          ...data.settings,
          lastBackupAt: now.toISOString(),
          lastClosedMonth: currentMonth(now),
          dismissedReminder: '',
        };
        await db.bulkUpsert([
          settingRow('lastBackupAt', settings.lastBackupAt),
          settingRow('lastClosedMonth', settings.lastClosedMonth ?? currentMonth(now)),
          settingRow('dismissedReminder', ''),
        ]);
        await db.remove('snapshots', 'pending');
        const next = { ...data, settings };
        return { data: next, reminder: evaluateReminder(settings, now) };
      });
    },

    async dismissReminder(key: string, now: Date): Promise<{ data: AppData; reminder: Reminder | null }> {
      return lock(async () => {
        const data = await load();
        const settings = { ...data.settings, dismissedReminder: key };
        await db.bulkUpsert([settingRow('dismissedReminder', key)]);
        const next = { ...data, settings };
        return { data: next, reminder: evaluateReminder(settings, now) };
      });
    },

    async restore(raw: string, now = new Date()): Promise<Result<{ data: AppData; reminder: Reminder | null }>> {
      return lock(async () => {
        let backup: BackupFile;
        try {
          backup = parseBackup(raw);
        } catch (error) {
          return fail(error instanceof Error ? error.message : 'El archivo no es un respaldo de Mis Gastos.');
        }
        await db.replaceAll(dataToRows(backup.data));
        const data = await ensureUnlocked(backup.data, now, null);
        return ok({ data, reminder: evaluateReminder(data.settings, now) });
      });
    },

    load,
    empty: emptyData,
  };
}

export type Repository = ReturnType<typeof createRepository>;
