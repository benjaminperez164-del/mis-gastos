import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { parseAmount } from '@/src/domain/money';
import type { ExpenseType } from '@/src/domain/types';
import type { TypeDraft } from '@/src/domain/validation';
import { theme } from '@/src/theme';
import { Button, ConfirmDialog, ErrorText, TextField } from './ui';

export function TypeForm({
  initial,
  onSubmit,
  onArchive,
  onDelete,
}: {
  initial?: ExpenseType | null;
  onSubmit: (draft: TypeDraft) => Promise<string | null>;
  onArchive?: (archived: boolean) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : '');
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [amount, setAmount] = useState(initial?.recurringAmount != null ? String(initial.recurringAmount) : '');
  const [day, setDay] = useState(initial?.recurringDay != null ? String(initial.recurringDay) : '1');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit() {
    const parsedBudget = budget.trim() ? parseAmount(budget) : null;
    if (budget.trim() && (parsedBudget == null || parsedBudget <= 0)) {
      setError('El presupuesto debe ser mayor a cero, o déjalo vacío.');
      return;
    }
    const parsedAmount = amount.trim() ? parseAmount(amount) : null;
    if (amount.trim() && parsedAmount == null) {
      setError('El monto estimado no es válido.');
      return;
    }
    const parsedDay = Number(day);
    setSaving(true);
    const message = await onSubmit({
      id: initial?.id,
      name,
      budget: parsedBudget,
      recurring,
      recurringAmount: parsedAmount,
      recurringDay: Number.isInteger(parsedDay) ? parsedDay : null,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <View style={styles.form}>
      <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Alimentación" />
      <TextField
        label="Presupuesto mensual (opcional)"
        value={budget}
        onChangeText={setBudget}
        placeholder="300"
        keyboardType="decimal-pad"
        hint="Aviso al 80% y cuando se supera. Solo cuenta gastos personales confirmados de ese mes."
      />
      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.label}>Recurrente</Text>
          <Text style={styles.hint}>Cada mes aparece por confirmar, con el monto estimado.</Text>
        </View>
        <Switch
          accessibilityLabel="Marcar como recurrente"
          value={recurring}
          onValueChange={setRecurring}
          trackColor={{ true: theme.primary, false: '#D5E0DC' }}
        />
      </View>
      {recurring ? (
        <>
          <TextField
            label="Monto estimado"
            value={amount}
            onChangeText={setAmount}
            placeholder="45"
            keyboardType="decimal-pad"
          />
          <TextField
            label="Día del mes"
            value={day}
            onChangeText={setDay}
            placeholder="1"
            keyboardType="number-pad"
            hint="Si el mes es más corto, se usa el último día."
          />
        </>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <Button label={saving ? 'Guardando…' : 'Guardar tipo'} onPress={() => void submit()} disabled={saving} />
      {initial && onArchive ? (
        <Button
          label={initial.archived ? 'Volver a mostrar' : 'Ocultar'}
          tone="secondary"
          onPress={() => void onArchive(!initial.archived).then((message) => message && setError(message))}
        />
      ) : null}
      {initial && onDelete ? (
        <Button label="Eliminar" tone="danger" onPress={() => setConfirmDelete(true)} />
      ) : null}
      <ConfirmDialog
        visible={confirmDelete}
        title="Eliminar tipo"
        message="Solo se puede eliminar si ningún gasto lo usa. Si ya tiene gastos, ocúltalo."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (!onDelete) return;
          void onDelete().then((message) => message && setError(message));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: '700', color: theme.text },
  hint: { fontSize: 13, color: theme.muted, lineHeight: 18 },
});
