import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ExpenseDraft } from '@/src/domain/validation';
import { formatAmountInput, parseAmount } from '@/src/domain/money';
import type { Expense, Scope } from '@/src/domain/types';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';
import { DateField } from './DateField';
import { PhotoPicker } from './PhotoPicker';
import { AmountField, Button, ChoiceGrid, ConfirmDialog, ErrorText, Segmented, TextField } from './ui';

export function ExpenseForm({
  initial,
  defaultDate,
  defaultProjectId,
  defaultScope = 'personal',
  onSubmit,
  onDelete,
}: {
  initial?: Expense | null;
  defaultDate: string;
  defaultProjectId?: string | null;
  defaultScope?: Scope;
  onSubmit: (draft: ExpenseDraft) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
}) {
  const { data } = useApp();
  const locked = Boolean(initial?.proformaId);
  const pending = initial?.status === 'por_confirmar';
  const [amount, setAmount] = useState(initial ? formatAmountInput(initial.amount) : '');
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [scope, setScope] = useState<Scope>(initial?.scope ?? (defaultProjectId ? 'proyecto' : defaultScope));
  const [typeId, setTypeId] = useState<string | null>(initial?.typeId ?? null);
  const [projectId, setProjectId] = useState<string | null>(initial?.projectId ?? defaultProjectId ?? null);
  const [photoId, setPhotoId] = useState<string | null>(initial?.receiptPhotoId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const types = data.types.filter((type) => !type.archived || type.id === initial?.typeId);
  const projects = data.projects.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));

  async function submit() {
    const parsed = parseAmount(amount);
    if (parsed == null || parsed <= 0) {
      setError('Ingresa un monto mayor a cero.');
      return;
    }
    setSaving(true);
    setError(null);
    const message = await onSubmit({
      id: initial?.id,
      amount: parsed,
      date,
      description,
      note,
      receiptPhotoId: photoId,
      scope,
      typeId,
      projectId,
      confirm: true,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <View style={styles.form}>
      {pending ? (
        <Text style={styles.note}>Este gasto es un estimado. Al confirmarlo entra en los totales del mes.</Text>
      ) : null}
      {locked ? (
        <Text style={styles.note}>Este gasto viene de una proforma. El monto se ajusta registrando pagos en la proforma.</Text>
      ) : null}
      <AmountField label="Monto" value={amount} onChangeText={setAmount} editable={!locked} />
      <DateField value={date} onChange={setDate} />
      <TextField label="Descripción" value={description} onChangeText={setDescription} placeholder="¿En qué se fue?" />
      <TextField label="Nota (opcional)" value={note} onChangeText={setNote} placeholder="Detalle, lugar, número de factura…" multiline />
      <PhotoPicker label="Comprobante (opcional)" photoId={photoId} onChange={setPhotoId} />
      <Segmented
        options={[
          { value: 'personal' as const, label: 'Personal' },
          { value: 'proyecto' as const, label: 'Proyecto' },
        ]}
        value={scope}
        disabled={locked}
        onChange={(next) => {
          setScope(next);
          if (next === 'personal') setProjectId(null);
        }}
      />
      {scope === 'personal' ? (
        <View style={styles.block}>
          <Text style={styles.label}>Tipo de gasto</Text>
          <ChoiceGrid options={types.map((type) => ({ id: type.id, label: type.name }))} value={typeId} onChange={setTypeId} />
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.label}>Proyecto</Text>
          {projects.length === 0 ? (
            <Text style={styles.note}>Primero crea un proyecto. Después podrás cargarle gastos.</Text>
          ) : (
            <ChoiceGrid
              options={projects.map((project) => ({
                id: project.id,
                label: project.status === 'cerrado' ? `${project.name} (cerrado)` : project.name,
              }))}
              value={projectId}
              onChange={setProjectId}
            />
          )}
          <Text style={styles.label}>Tipo (opcional)</Text>
          <ChoiceGrid
            options={[{ id: '', label: 'Sin tipo' }, ...types.map((type) => ({ id: type.id, label: type.name }))]}
            value={typeId ?? ''}
            onChange={(id) => setTypeId(id || null)}
          />
        </View>
      )}
      <ErrorText>{error}</ErrorText>
      <Button label={saving ? 'Guardando…' : pending ? 'Confirmar gasto' : 'Guardar gasto'} onPress={() => void submit()} disabled={saving} />
      {onDelete ? (
        <Button label="Eliminar" tone="danger" onPress={() => setConfirmDelete(true)} disabled={saving} />
      ) : null}
      <ConfirmDialog
        visible={confirmDelete}
        title="Eliminar gasto"
        message="Se borrará de este dispositivo. Si venía de una proforma, el saldo pendiente vuelve a subir."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (!onDelete) return;
          void onDelete().then((message) => {
            if (message) setError(message);
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  block: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: theme.text },
  note: { fontSize: 14, lineHeight: 20, color: theme.muted },
});
