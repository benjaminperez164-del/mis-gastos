import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/src/domain/money';
import { useApp } from '@/src/state/AppContext';
import { pickTextFile } from '@/src/platform/files';
import { shadow, theme } from '@/src/theme';
import { Badge, Banner, Button, ConfirmDialog, ErrorText, PageTitle, Screen, SectionTitle } from '@/src/components/ui';

export default function Ajustes() {
  const router = useRouter();
  const { data, reminder, shareBackup, dismissReminder, restoreBackup } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const visible = data.types.filter((type) => !type.archived);
  const hidden = data.types.filter((type) => type.archived);

  async function share() {
    setBusy(true);
    setInfo(null);
    const message = await shareBackup();
    setBusy(false);
    if (message) setError(message);
    else setInfo('Respaldo listo. En el teléfono elige Guardar en Drive. En el navegador se descargó el archivo.');
  }

  async function pick() {
    setError(null);
    const raw = await pickTextFile();
    if (!raw) return;
    setPendingFile(raw);
  }

  return (
    <Screen>
      <PageTitle title="Ajustes" subtitle="Tipos de gasto, recurrentes y una copia de seguridad para llevarte a otro teléfono." />
      {reminder ? (
        <Banner
          title={reminder.title}
          message={reminder.message}
          actionLabel="Compartir respaldo"
          onAction={() => void share()}
          onDismiss={() => void dismissReminder()}
        />
      ) : null}
      <SectionTitle>Tipos de gasto</SectionTitle>
      <Text style={styles.help}>
        La categoría personal es fija. Dentro defines los tipos. Vivienda y Servicios vienen como recurrentes de ejemplo: ábrelos para cambiar el monto o apagarlos.
      </Text>
      <Button label="Nuevo tipo" icon="add" onPress={() => router.push('/tipo/nuevo')} />
      {visible.map((type) => (
        <Pressable key={type.id} accessibilityRole="button" onPress={() => router.push(`/tipo/${type.id}`)} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.name}>{type.name}</Text>
            {type.recurring ? <Badge tone="warning">Recurrente</Badge> : null}
          </View>
          <Text style={styles.meta}>
            {type.budget != null ? `Presupuesto ${formatMoney(type.budget)} / mes` : 'Sin presupuesto'}
            {type.recurring
              ? ` · día ${type.recurringDay ?? 1}${type.recurringAmount != null ? ` · estimado ${formatMoney(type.recurringAmount)}` : ''}`
              : ''}
          </Text>
        </Pressable>
      ))}
      {hidden.length > 0 ? <Text style={styles.help}>Ocultos: {hidden.map((type) => type.name).join(', ')}. Ábrelos para mostrarlos de nuevo.</Text> : null}
      {hidden.map((type) => (
        <Pressable key={type.id} onPress={() => router.push(`/tipo/${type.id}`)} style={styles.card}>
          <Text style={styles.name}>{type.name}</Text>
          <Text style={styles.meta}>Oculto</Text>
        </Pressable>
      ))}
      <SectionTitle>Respaldo</SectionTitle>
      <Text style={styles.help}>
        Los datos viven solo en este dispositivo. Cada semana, y al empezar un mes nuevo, Mis Gastos prepara un archivo JSON y te avisa. Pulsa compartir y elige Guardar en Drive. En el navegador, el archivo se descarga.
      </Text>
      <Text style={styles.help}>
        El respaldo incluye las fotos de los comprobantes. Si adjuntas muchas, el archivo puede pesar bastante.
      </Text>
      <Text style={styles.meta}>
        Último respaldo:{' '}
        {data.settings.lastBackupAt
          ? new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.settings.lastBackupAt))
          : 'todavía ninguno'}
      </Text>
      <Button label={busy ? 'Preparando…' : 'Generar y compartir'} icon="share-outline" onPress={() => void share()} disabled={busy} />
      <Button label="Restaurar desde un archivo" tone="secondary" icon="cloud-upload-outline" onPress={() => void pick()} />
      <ErrorText>{error}</ErrorText>
      {info ? <Text style={styles.ok}>{info}</Text> : null}
      <SectionTitle>Acerca de</SectionTitle>
      <Text style={styles.help}>Mis Gastos · dólares (USD) · sin cuentas · los datos no salen del teléfono salvo que tú compartas el respaldo.</Text>
      <ConfirmDialog
        visible={pendingFile != null}
        title="Restaurar respaldo"
        message="Esto reemplaza todos los gastos, proyectos, proformas y fotos de este dispositivo. Conviene tener un respaldo reciente antes de seguir."
        confirmLabel="Reemplazar datos"
        danger
        busy={busy}
        onCancel={() => setPendingFile(null)}
        onConfirm={() => {
          if (!pendingFile) return;
          setBusy(true);
          void restoreBackup(pendingFile).then((message) => {
            setBusy(false);
            setPendingFile(null);
            if (message) setError(message);
            else setInfo('Datos restaurados.');
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: { color: theme.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: theme.white, borderRadius: 16, padding: 16, gap: 4, ...shadow },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: theme.text },
  meta: { color: theme.muted, fontSize: 13 },
  ok: { color: theme.ok, fontWeight: '700' },
});
