import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/src/domain/money';
import { isSettled, pendingBalance, paidAmount } from '@/src/domain/proformas';
import type { ProformaStatus } from '@/src/domain/types';
import { useApp } from '@/src/state/AppContext';
import { shadow, theme } from '@/src/theme';
import { Badge, Button, Empty, ErrorText, PageTitle, Screen } from '@/src/components/ui';

const FILTERS: { id: 'todas' | ProformaStatus; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'aprobada', label: 'Aprobadas' },
  { id: 'rechazada', label: 'Rechazadas' },
];

const STATUS_LABEL: Record<ProformaStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export default function Proformas() {
  const router = useRouter();
  const params = useLocalSearchParams<{ proyecto?: string }>();
  const projectFilter = typeof params.proyecto === 'string' ? params.proyecto : '';
  const { data } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todas');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return data.proformas
      .filter((proforma) => (projectFilter ? proforma.projectId === projectFilter : true))
      .filter((proforma) => (filter === 'todas' ? true : proforma.status === filter))
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [data.proformas, filter, projectFilter]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function compare() {
    const chosen = data.proformas.filter((proforma) => selected.includes(proforma.id));
    const projectId = chosen[0]?.projectId;
    if (chosen.length < 2) {
      setError('Elige al menos dos proformas.');
      return;
    }
    if (chosen.some((proforma) => proforma.projectId !== projectId)) {
      setError('Solo puedes comparar proformas del mismo proyecto.');
      return;
    }
    router.push(`/proforma/comparar?ids=${selected.join(',')}`);
  }

  return (
    <Screen>
      <PageTitle
        title="Proformas"
        subtitle="Cotizaciones de un proyecto. Aprueba una y conviértela en gastos, completos o por anticipos."
      />
      <Button label="Nueva proforma" icon="add" onPress={() => router.push(projectFilter ? `/proforma/nueva?proyecto=${projectFilter}` : '/proforma/nueva')} />
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.chip, filter === item.id && styles.chipOn]}>
            <Text style={[styles.chipText, filter === item.id && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Button
        label={selecting ? 'Cancelar comparación' : 'Comparar'}
        tone="secondary"
        onPress={() => {
          setSelecting((value) => !value);
          setSelected([]);
          setError(null);
        }}
      />
      {selecting ? <Button label="Ver comparación" onPress={compare} disabled={selected.length < 2} /> : null}
      <ErrorText>{error}</ErrorText>
      {rows.length === 0 ? (
        <Empty title="No hay proformas en esta vista" body="Carga dos o más del mismo proyecto para compararlas antes de aprobar." />
      ) : (
        rows.map((proforma) => {
          const project = data.projects.find((item) => item.id === proforma.projectId);
          const paid = paidAmount(proforma.id, data.payments);
          const pending = pendingBalance(proforma, data.payments);
          const tone = proforma.status === 'aprobada' ? 'ok' : proforma.status === 'rechazada' ? 'danger' : 'warning';
          return (
            <Pressable
              key={proforma.id}
              accessibilityRole="button"
              onPress={() => (selecting ? toggle(proforma.id) : router.push(`/proforma/${proforma.id}`))}
              style={[styles.card, selected.includes(proforma.id) && styles.selected]}
            >
              <View style={styles.head}>
                <Text style={styles.supplier}>{proforma.supplier}</Text>
                <Badge tone={tone}>{isSettled(proforma, data.payments) ? 'Pagada' : STATUS_LABEL[proforma.status]}</Badge>
              </View>
              <Text style={styles.desc}>{proforma.description}</Text>
              <Text style={styles.meta}>{project?.name ?? 'Proyecto'}</Text>
              <Text style={styles.amount}>{formatMoney(proforma.amount)}</Text>
              {proforma.status === 'aprobada' ? (
                <Text style={styles.meta}>
                  Pagado {formatMoney(paid)} · Pendiente {formatMoney(pending)}
                </Text>
              ) : null}
              {selecting ? <Text style={styles.meta}>{selected.includes(proforma.id) ? 'Seleccionada' : 'Toca para seleccionar'}</Text> : null}
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: theme.primary },
  chipText: { fontWeight: '700', color: theme.text },
  chipTextOn: { color: theme.white },
  card: { backgroundColor: theme.white, borderRadius: 18, padding: 16, gap: 4, ...shadow },
  selected: { borderWidth: 2, borderColor: theme.primary },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  supplier: { flex: 1, fontSize: 17, fontWeight: '800', color: theme.text },
  desc: { color: theme.text },
  meta: { color: theme.muted, fontSize: 13 },
  amount: { fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 4 },
});
