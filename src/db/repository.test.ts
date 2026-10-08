import { describe, expect, it } from 'vitest';
import { exportBackup, serializeBackup } from '@/src/domain/backup';
import { pendingBalance } from '@/src/domain/proformas';
import { createMemoryDatabase } from './memory';
import { createRepository } from './repository';

function ids() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('repositorio', () => {
  it('genera recurrentes una sola vez y no los revive si se eliminan', async () => {
    const repo = createRepository(createMemoryDatabase(), ids());
    const now = new Date(2026, 9, 8);
    const first = await repo.initialize(now);
    const pending = first.data.expenses.filter((expense) => expense.status === 'por_confirmar');
    expect(pending.map((expense) => expense.description).sort()).toEqual(['Servicios', 'Vivienda']);
    const second = await repo.ensureMonth(now, '2026-10');
    expect(second.expenses.filter((expense) => expense.recurringTypeId)).toHaveLength(2);

    const vivienda = pending.find((expense) => expense.description === 'Vivienda');
    if (!vivienda) throw new Error('falta vivienda');
    const removed = await repo.deleteExpense(vivienda.id);
    expect(removed.ok).toBe(true);
    const third = await repo.ensureMonth(now, '2026-10');
    expect(third.expenses.some((expense) => expense.description === 'Vivienda' && expense.recurringMonth === '2026-10')).toBe(
      false,
    );
    expect(third.expenses.some((expense) => expense.description === 'Servicios')).toBe(true);
  });

  it('aprueba una proforma con anticipo y conserva el saldo', async () => {
    const repo = createRepository(createMemoryDatabase(), ids());
    const now = new Date(2026, 9, 8);
    await repo.initialize(now);
    const project = await repo.saveProject({ name: 'Cocina', budget: 1000 }, now);
    if (!project.ok) throw new Error(project.error);
    const projectId = project.value.projects[0]?.id;
    if (!projectId) throw new Error('proyecto');
    const created = await repo.saveProforma(
      {
        projectId,
        supplier: 'Ferretería Luna',
        description: 'Cemento',
        amount: 500,
        attachmentPhotoId: null,
      },
      now,
    );
    if (!created.ok) throw new Error(created.error);
    const proformaId = created.value.proformas[0]?.id;
    if (!proformaId) throw new Error('proforma');
    const approved = await repo.approveProformaAction(proformaId, { amount: 150, date: '2026-10-08' }, now);
    if (!approved.ok) throw new Error(approved.error);
    const proforma = approved.value.proformas.find((item) => item.id === proformaId);
    if (!proforma) throw new Error('proforma aprobada');
    expect(proforma.status).toBe('aprobada');
    expect(pendingBalance(proforma, approved.value.payments)).toBe(350);
    expect(approved.value.expenses.some((expense) => expense.proformaId === proformaId && expense.amount === 150)).toBe(
      true,
    );
    const extra = await repo.addPayment(proformaId, { amount: 400, date: '2026-10-09' }, now);
    expect(extra.ok).toBe(false);
  });

  it('el respaldo reemplaza todo el estado, incluidas las fotos', async () => {
    const repo = createRepository(createMemoryDatabase(), ids());
    const now = new Date(2026, 9, 8);
    const initial = await repo.initialize(now);
    const photo = await repo.addPhoto({ mime: 'image/jpeg', dataBase64: 'aG9sYQ==' }, now);
    if (!photo.ok) throw new Error('foto');
    const typeId = initial.data.types[0]?.id;
    if (!typeId) throw new Error('tipo');
    const saved = await repo.saveExpense(
      {
        amount: 18,
        date: '2026-10-04',
        description: 'Mercado',
        note: null,
        receiptPhotoId: photo.value.id,
        scope: 'personal',
        typeId,
        projectId: null,
        confirm: true,
      },
      now,
    );
    if (!saved.ok) throw new Error(saved.error);
    const json = serializeBackup(exportBackup(saved.value, '2026-10-08T00:00:00.000Z'));

    const other = await repo.saveProject({ name: 'Temporal', budget: null }, now);
    if (!other.ok) throw new Error(other.error);
    expect(other.value.projects).toHaveLength(1);

    const restored = await repo.restore(json, now);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.value.data.projects).toEqual([]);
    expect(restored.value.data.photos.map((item) => item.dataBase64)).toEqual(['aG9sYQ==']);
    expect(restored.value.data.expenses.some((expense) => expense.description === 'Mercado')).toBe(true);
    expect(restored.value.data.expenses.some((expense) => expense.recurringTypeId)).toBe(true);
  });
});
