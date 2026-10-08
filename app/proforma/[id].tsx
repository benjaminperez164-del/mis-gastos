import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { todayISO, formatDate } from '@/src/domain/dates';
import { formatAmountInput, formatMoney, parseAmount } from '@/src/domain/money';
import { isSettled, paidAmount, pendingBalance } from '@/src/domain/proformas';
import { photoSrc } from '@/src/platform/photos';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';
import { BudgetBar } from '@/src/components/BudgetBar';
import { DateField } from '@/src/components/DateField';
import { AmountField, Badge, Button, Card, ConfirmDialog, Empty, ErrorText, Screen, SectionTitle } from '@/src/components/ui';

export default function ProformaDetalle() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, approveProforma, addPayment, rejectProforma } = useApp();
  const proforma = data.proformas.find((item) => item.id === id);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  useEffect(() => {
    if (!proforma) return;
    const remaining = proforma.status === 'aprobada' ? pendingBalance(proforma, data.payments) : proforma.amount;
    setAmount(formatAmountInput(Math.max(remaining, 0)));
  }, [proforma, data.payments]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  if (!proforma) {
    return (
      <Screen inset="stack">
        <Empty title="Esa proforma ya no está" />
      </Screen>
    );
  }

  const project = data.projects.find((item) => item.id === proforma.projectId);
  const paid = paidAmount(proforma.id, data.payments);
  const pending = pendingBalance(proforma, data.payments);
  const photo = data.photos.find((item) => item.id === proforma.attachmentPhotoId);
  const payments = data.payments
    .filter((payment) => payment.proformaId === proforma.id)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const settled = isSettled(proforma, data.payments);

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await action();
    setBusy(false);
    if (message) setError(message);
  }

  function parsedPayment() {
    const parsed = parseAmount(amount);
    if (parsed == null || parsed <= 0) {
      setError('Ingresa un monto mayor a cero.');
      return null;
    }
    return parsed;
  }

  return (
    <Screen inset="stack">
      <Badge tone={proforma.status === 'aprobada' ? 'ok' : proforma.status === 'rechazada' ? 'danger' : 'warning'}>
        {settled ? 'Pagada' : proforma.status === 'aprobada' ? 'Aprobada' : proforma.status === 'rechazada' ? 'Rechazada' : 'Pendiente'}
      </Badge>
      <Text style={styles.supplier}>{proforma.supplier}</Text>
      <Text style={styles.project} onPress={() => router.push(`/proyecto/${proforma.projectId}`)}>
        {project?.name ?? 'Proyecto'}
      </Text>
      <Text style={styles.amount}>{formatMoney(proforma.amount)}</Text>
      <Text style={styles.body}>{proforma.description}</Text>
      {proforma.status === 'aprobada' ? (
        <Card>
          <Text style={styles.label}>Pagado {formatMoney(paid)}</Text>
          <Text style={styles.label}>Pendiente {formatMoney(pending)}</Text>
          <BudgetBar spent={paid} budget={proforma.amount} />
        </Card>
      ) : null}
      {photo ? <Image source={{ uri: photoSrc(photo) }} style={styles.photo} accessibilityLabel="Adjunto de la proforma" /> : null}
      {proforma.status === 'pendiente' ? (
        <View style={styles.block}>
          <AmountField label="Pago al aprobar" value={amount} onChangeText={setAmount} />
          <DateField label="Fecha del pago" value={date} onChange={setDate} />
          <Button
            label={busy ? 'Guardando…' : 'Aprobar y registrar pago'}
            disabled={busy}
            onPress={() => {
              const parsed = parsedPayment();
              if (parsed == null) return;
              void run(() => approveProforma(proforma.id, { amount: parsed, date }));
            }}
          />
          <Button
            label="Aprobar sin pago todavía"
            tone="secondary"
            disabled={busy}
            onPress={() => void run(() => approveProforma(proforma.id, null))}
          />
          <Button label="Rechazar" tone="danger" disabled={busy} onPress={() => setConfirmReject(true)} />
        </View>
      ) : null}
      {proforma.status === 'aprobada' && pending > 0 ? (
        <View style={styles.block}>
          <SectionTitle>Anticipo</SectionTitle>
          <AmountField label="Monto del pago" value={amount} onChangeText={setAmount} />
          <DateField label="Fecha del pago" value={date} onChange={setDate} />
          <Button
            label={busy ? 'Guardando…' : 'Registrar anticipo'}
            disabled={busy}
            onPress={() => {
              const parsed = parsedPayment();
              if (parsed == null) return;
              void run(() => addPayment(proforma.id, { amount: parsed, date }));
            }}
          />
        </View>
      ) : null}
      <ErrorText>{error}</ErrorText>
      {payments.length > 0 ? (
        <>
          <SectionTitle>Pagos</SectionTitle>
          {payments.map((payment) => {
            const expense = data.expenses.find((item) => item.id === payment.expenseId);
            return (
              <Card key={payment.id}>
                <Text style={styles.label}>{expense?.description ?? 'Pago'}</Text>
                <Text style={styles.body}>
                  {formatDate(payment.date)} · {formatMoney(payment.amount)}
                </Text>
                {expense ? (
                  <Button label="Ver gasto" tone="ghost" onPress={() => router.push(`/gasto/${expense.id}`)} />
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}
      <ConfirmDialog
        visible={confirmReject}
        title="Rechazar proforma"
        message="No se crearán gastos. Podrás dejarla como referencia."
        confirmLabel="Rechazar"
        danger
        onCancel={() => setConfirmReject(false)}
        onConfirm={() => {
          setConfirmReject(false);
          void run(() => rejectProforma(proforma.id));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  supplier: { fontSize: 28, fontWeight: '800', color: theme.text },
  project: { color: theme.primary, fontWeight: '700', fontSize: 16 },
  amount: { fontSize: 32, fontWeight: '800', color: theme.text },
  body: { color: theme.muted, fontSize: 15, lineHeight: 21 },
  label: { fontWeight: '800', color: theme.text, fontSize: 16 },
  photo: { width: '100%', height: 200, borderRadius: 16, backgroundColor: '#E7EFEC' },
  block: { gap: 12 },
});
