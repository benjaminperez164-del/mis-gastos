import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { parseAmount } from '@/src/domain/money';
import type { Project } from '@/src/domain/types';
import type { ProjectDraft } from '@/src/domain/validation';
import { Button, ErrorText, TextField } from './ui';

export function ProjectForm({
  initial,
  onSubmit,
}: {
  initial?: Project | null;
  onSubmit: (draft: ProjectDraft) => Promise<string | null>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsed = budget.trim() ? parseAmount(budget) : null;
    if (budget.trim() && (parsed == null || parsed <= 0)) {
      setError('El presupuesto debe ser mayor a cero, o déjalo vacío.');
      return;
    }
    setSaving(true);
    const message = await onSubmit({
      id: initial?.id,
      name,
      budget: parsed,
      status: initial?.status,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <View style={styles.form}>
      <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Remodelación cocina" />
      <TextField
        label="Presupuesto total (opcional)"
        value={budget}
        onChangeText={setBudget}
        placeholder="1500"
        keyboardType="decimal-pad"
        hint="El proyecto junta gastos de todos los meses. Aviso al 80% y al superarlo."
      />
      <ErrorText>{error}</ErrorText>
      <Button label={saving ? 'Guardando…' : 'Guardar proyecto'} onPress={() => void submit()} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
