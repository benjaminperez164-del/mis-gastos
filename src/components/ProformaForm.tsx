import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseAmount } from '@/src/domain/money';
import type { Proforma } from '@/src/domain/types';
import type { ProformaDraft } from '@/src/domain/validation';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';
import { PhotoPicker } from './PhotoPicker';
import { Button, ChoiceGrid, ErrorText, TextField } from './ui';

export function ProformaForm({
  initial,
  defaultProjectId,
  onSubmit,
}: {
  initial?: Proforma | null;
  defaultProjectId?: string | null;
  onSubmit: (draft: ProformaDraft) => Promise<string | null>;
}) {
  const { data } = useApp();
  const [projectId, setProjectId] = useState(initial?.projectId ?? defaultProjectId ?? data.projects[0]?.id ?? '');
  const [supplier, setSupplier] = useState(initial?.supplier ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [photoId, setPhotoId] = useState<string | null>(initial?.attachmentPhotoId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsed = parseAmount(amount);
    if (parsed == null || parsed <= 0) {
      setError('Ingresa un monto mayor a cero.');
      return;
    }
    if (!projectId) {
      setError('Elige un proyecto.');
      return;
    }
    setSaving(true);
    const message = await onSubmit({
      id: initial?.id,
      projectId,
      supplier,
      description,
      amount: parsed,
      attachmentPhotoId: photoId,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Proyecto</Text>
      {data.projects.length === 0 ? (
        <Text style={styles.hint}>Crea un proyecto antes de cargar proformas.</Text>
      ) : (
        <ChoiceGrid
          options={data.projects.map((project) => ({ id: project.id, label: project.name }))}
          value={projectId}
          onChange={setProjectId}
        />
      )}
      <TextField label="Proveedor" value={supplier} onChangeText={setSupplier} placeholder="Ferretería Luna" />
      <TextField label="Descripción" value={description} onChangeText={setDescription} placeholder="Cemento y agregados" multiline />
      <TextField label="Monto" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="500" />
      <PhotoPicker label="Adjunto (opcional)" photoId={photoId} onChange={setPhotoId} />
      <ErrorText>{error}</ErrorText>
      <Button label={saving ? 'Guardando…' : 'Guardar proforma'} onPress={() => void submit()} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  label: { fontSize: 14, fontWeight: '700', color: theme.text },
  hint: { color: theme.muted, fontSize: 14 },
});
