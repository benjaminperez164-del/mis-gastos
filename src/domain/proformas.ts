import { isValidDate } from './dates';
import { roundMoney, sumMoney, toCents } from './money';
import { fail, ok, type Expense, type Payment, type Proforma, type Result } from './types';

export interface PaymentInput {
  amount: number;
  date: string;
  note?: string | null;
}

export function paidAmount(proformaId: string, payments: Payment[]): number {
  return sumMoney(payments.filter((payment) => payment.proformaId === proformaId).map((payment) => payment.amount));
}

export function pendingBalance(proforma: Proforma, payments: Payment[]): number {
  return roundMoney(proforma.amount - paidAmount(proforma.id, payments));
}

export function isSettled(proforma: Proforma, payments: Payment[]): boolean {
  return proforma.status === 'aprobada' && toCents(pendingBalance(proforma, payments)) <= 0;
}

function paymentDescription(paidBefore: number, amount: number, total: number, supplier: string): string {
  const after = paidBefore + amount;
  if (toCents(paidBefore) === 0 && toCents(after) === toCents(total)) return `Proforma: ${supplier}`;
  if (toCents(after) >= toCents(total)) return `Pago final: ${supplier}`;
  return `Anticipo: ${supplier}`;
}

function buildExpense(options: {
  proforma: Proforma;
  payment: PaymentInput;
  paidBefore: number;
  now: string;
  createId: () => string;
}): { expense: Expense; payment: Payment } {
  const expenseId = options.createId();
  const paymentId = options.createId();
  const expense: Expense = {
    id: expenseId,
    amount: roundMoney(options.payment.amount),
    date: options.payment.date,
    description: paymentDescription(
      options.paidBefore,
      options.payment.amount,
      options.proforma.amount,
      options.proforma.supplier,
    ),
    note: options.payment.note?.trim() || options.proforma.description,
    receiptPhotoId: null,
    scope: 'proyecto',
    typeId: null,
    projectId: options.proforma.projectId,
    status: 'confirmado',
    recurringTypeId: null,
    recurringMonth: null,
    proformaId: options.proforma.id,
    createdAt: options.now,
  };
  const payment: Payment = {
    id: paymentId,
    proformaId: options.proforma.id,
    expenseId,
    amount: roundMoney(options.payment.amount),
    date: options.payment.date,
    note: options.payment.note?.trim() || null,
    createdAt: options.now,
  };
  return { expense, payment };
}

function validatePayment(payment: PaymentInput, remaining: number): string | null {
  if (!Number.isFinite(payment.amount) || toCents(payment.amount) <= 0) return 'monto_invalido';
  if (toCents(payment.amount) > toCents(remaining)) return 'excede_saldo';
  if (!isValidDate(payment.date)) return 'fecha_invalida';
  return null;
}

export function approveProforma(options: {
  proforma: Proforma;
  payments: Payment[];
  initialPayment: PaymentInput | null;
  now: string;
  createId: () => string;
}): Result<{ proforma: Proforma; expense: Expense | null; payment: Payment | null }> {
  if (options.proforma.status === 'rechazada') return fail('rechazada');
  if (options.proforma.status !== 'pendiente') return fail('ya_aprobada');
  const approved: Proforma = { ...options.proforma, status: 'aprobada' };
  if (!options.initialPayment) {
    return ok({ proforma: approved, expense: null, payment: null });
  }
  const error = validatePayment(options.initialPayment, options.proforma.amount);
  if (error) return fail(error);
  const built = buildExpense({
    proforma: approved,
    payment: options.initialPayment,
    paidBefore: 0,
    now: options.now,
    createId: options.createId,
  });
  return ok({ proforma: approved, expense: built.expense, payment: built.payment });
}

export function registerPayment(options: {
  proforma: Proforma;
  payments: Payment[];
  payment: PaymentInput;
  now: string;
  createId: () => string;
}): Result<{ expense: Expense; payment: Payment }> {
  if (options.proforma.status === 'rechazada') return fail('rechazada');
  if (options.proforma.status !== 'aprobada') return fail('no_aprobada');
  const remaining = pendingBalance(options.proforma, options.payments);
  const error = validatePayment(options.payment, remaining);
  if (error) return fail(error);
  return ok(
    buildExpense({
      proforma: options.proforma,
      payment: options.payment,
      paidBefore: paidAmount(options.proforma.id, options.payments),
      now: options.now,
      createId: options.createId,
    }),
  );
}

export function rejectProforma(proforma: Proforma): Result<Proforma> {
  if (proforma.status !== 'pendiente') return fail('no_pendiente');
  return ok({ ...proforma, status: 'rechazada' });
}

export interface ComparisonItem {
  proforma: Proforma;
  paid: number;
  pending: number;
  lowest: boolean;
}

export function compareProformas(
  proformas: Proforma[],
  payments: Payment[],
): Result<{ projectId: string; items: ComparisonItem[] }> {
  if (proformas.length < 2) return fail('elige_dos');
  const projectId = proformas[0]?.projectId;
  if (!projectId || proformas.some((proforma) => proforma.projectId !== projectId)) {
    return fail('distinto_proyecto');
  }
  const lowest = Math.min(...proformas.map((proforma) => toCents(proforma.amount)));
  return ok({
    projectId,
    items: proformas.map((proforma) => ({
      proforma,
      paid: paidAmount(proforma.id, payments),
      pending: pendingBalance(proforma, payments),
      lowest: toCents(proforma.amount) === lowest,
    })),
  });
}
