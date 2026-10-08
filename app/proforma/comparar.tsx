import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/src/domain/money';
import { compareProformas } from '@/src/domain/proformas';
import { useApp } from '@/src/state/AppContext';
import { shadow, theme } from '@/src/theme';
import { Badge, Empty, Screen } from '@/src/components/ui';

const STATUS = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const;

export default function CompararProformas() {
  const params = useLocalSearchParams<{ ids?: string }>();
  const { data } = useApp();
  const ids = typeof params.ids === 'string' ? params.ids.split(',').filter(Boolean) : [];
  const chosen = data.proformas.filter((proforma) => ids.includes(proforma.id));
  const comparison = compareProformas(chosen, data.payments);

  if (!comparison.ok) {
    return (
      <Screen inset="stack">
        <Empty
          title="No se puede comparar"
          body={
            comparison.error === 'distinto_proyecto'
              ? 'Elige proformas del mismo proyecto.'
              : 'Elige al menos dos proformas del mismo proyecto.'
          }
        />
      </Screen>
    );
  }

  const project = data.projects.find((item) => item.id === comparison.value.projectId);

  return (
    <Screen inset="stack" scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Comparar</Text>
        <Text style={styles.subtitle}>{project?.name ?? 'Proyecto'}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {comparison.value.items.map((item) => (
          <View key={item.proforma.id} style={[styles.card, item.lowest && styles.lowest]}>
            {item.lowest ? <Badge tone="ok">Menor precio</Badge> : <Badge>Opción</Badge>}
            <Text style={styles.supplier}>{item.proforma.supplier}</Text>
            <Text style={styles.amount}>{formatMoney(item.proforma.amount)}</Text>
            <Text style={styles.body}>{item.proforma.description}</Text>
            <Text style={styles.meta}>{STATUS[item.proforma.status]}</Text>
            <Text style={styles.meta}>Pagado {formatMoney(item.paid)}</Text>
            <Text style={styles.meta}>Pendiente {formatMoney(item.pending)}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 0, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text },
  subtitle: { color: theme.muted },
  row: { padding: 20, gap: 12 },
  card: {
    width: 250,
    backgroundColor: theme.white,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  lowest: { borderColor: theme.ok },
  supplier: { fontSize: 18, fontWeight: '800', color: theme.text },
  amount: { fontSize: 26, fontWeight: '800', color: theme.text },
  body: { color: theme.text, lineHeight: 20 },
  meta: { color: theme.muted, fontWeight: '600' },
});
