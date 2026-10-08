import { describe, expect, it } from 'vitest';
import { approveProforma, compareProformas, pendingBalance, registerPayment, rejectProforma } from './proformas';
import type { Proforma } from './types';

function proforma(partial: Partial<Proforma> = {}): Proforma {
  return {
    id: 'p1',
    projectId: 'obra',
    supplier: 'Ferretería Luna',
    description: 'Cemento',
    amount: 500,
    attachmentPhotoId: null,
    status: 'pendiente',
    createdAt: '2026-10-01',
    ...partial,
  };
}

function ids() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('proformas', () => {
  it('aprobar con el total crea un gasto y deja el saldo en cero', () => {
    const result = approveProforma({
      proforma: proforma(),
      payments: [],
      initialPayment: { amount: 500, date: '2026-10-08' },
      now: '2026-10-08T12:00:00.000Z',
      createId: ids(),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.proforma.status).toBe('aprobada');
    expect(result.value.expense).toMatchObject({
      amount: 500,
      scope: 'proyecto',
      projectId: 'obra',
      proformaId: 'p1',
      status: 'confirmado',
      description: 'Proforma: Ferretería Luna',
    });
    expect(result.value.payment?.expenseId).toBe(result.value.expense?.id);
    const balance = pendingBalance(result.value.proforma, result.value.payment ? [result.value.payment] : []);
    expect(balance).toBe(0);
  });

  it('un anticipo deja saldo y el siguiente pago no puede pasarse', () => {
    const approved = approveProforma({
      proforma: proforma(),
      payments: [],
      initialPayment: { amount: 200, date: '2026-10-02' },
      now: '2026-10-02',
      createId: ids(),
    });
    if (!approved.ok || !approved.value.payment) throw new Error('aprobación');
    expect(approved.value.expense?.description).toBe('Anticipo: Ferretería Luna');
    expect(pendingBalance(approved.value.proforma, [approved.value.payment])).toBe(300);

    const second = registerPayment({
      proforma: approved.value.proforma,
      payments: [approved.value.payment],
      payment: { amount: 300, date: '2026-11-01' },
      now: '2026-11-01',
      createId: ids(),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.expense.description).toBe('Pago final: Ferretería Luna');
    expect(pendingBalance(approved.value.proforma, [approved.value.payment, second.value.payment])).toBe(0);

    const overflow = registerPayment({
      proforma: approved.value.proforma,
      payments: [approved.value.payment, second.value.payment],
      payment: { amount: 1, date: '2026-11-02' },
      now: '2026-11-02',
      createId: ids(),
    });
    expect(overflow).toEqual({ ok: false, error: 'excede_saldo' });
  });

  it('aprobar sin pago deja la proforma aprobada y el saldo completo', () => {
    const result = approveProforma({
      proforma: proforma(),
      payments: [],
      initialPayment: null,
      now: '2026-10-08',
      createId: ids(),
    });
    if (!result.ok) throw new Error('aprobación');
    expect(result.value.expense).toBeNull();
    expect(pendingBalance(result.value.proforma, [])).toBe(500);
    const later = registerPayment({
      proforma: result.value.proforma,
      payments: [],
      payment: { amount: 50, date: '2026-10-09' },
      now: '2026-10-09',
      createId: ids(),
    });
    expect(later.ok).toBe(true);
  });

  it('no se puede aprobar dos veces ni pagar una rechazada', () => {
    const once = approveProforma({
      proforma: proforma(),
      payments: [],
      initialPayment: null,
      now: '2026-10-08',
      createId: ids(),
    });
    if (!once.ok) throw new Error('aprobación');
    const twice = approveProforma({
      proforma: once.value.proforma,
      payments: [],
      initialPayment: { amount: 10, date: '2026-10-08' },
      now: '2026-10-08',
      createId: ids(),
    });
    expect(twice).toEqual({ ok: false, error: 'ya_aprobada' });

    const rejected = rejectProforma(proforma());
    if (!rejected.ok) throw new Error('rechazo');
    expect(rejected.value.status).toBe('rechazada');
    const paid = registerPayment({
      proforma: rejected.value,
      payments: [],
      payment: { amount: 10, date: '2026-10-08' },
      now: '2026-10-08',
      createId: ids(),
    });
    expect(paid).toEqual({ ok: false, error: 'rechazada' });
    expect(
      approveProforma({
        proforma: rejected.value,
        payments: [],
        initialPayment: null,
        now: '2026-10-08',
        createId: ids(),
      }).ok,
    ).toBe(false);
  });

  it('compara proformas del mismo proyecto y marca la más baja', () => {
    const rows = [
      proforma({ id: 'a', amount: 800, supplier: 'A' }),
      proforma({ id: 'b', amount: 640, supplier: 'B' }),
      proforma({ id: 'c', amount: 700, supplier: 'C' }),
    ];
    const comparison = compareProformas(rows, []);
    expect(comparison.ok).toBe(true);
    if (!comparison.ok) return;
    expect(comparison.value.items.find((item) => item.lowest)?.proforma.id).toBe('b');
    expect(compareProformas([rows[0]!], []).ok).toBe(false);
    expect(compareProformas([rows[0]!, proforma({ id: 'z', projectId: 'otro' })], []).ok).toBe(false);
  });
});
