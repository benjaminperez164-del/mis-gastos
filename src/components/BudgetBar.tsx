import { StyleSheet, Text, View } from 'react-native';
import { budgetLevel, budgetPercent, formatPercent } from '@/src/domain/budgets';
import { formatMoney } from '@/src/domain/money';
import { theme } from '@/src/theme';

export function BudgetBar({
  spent,
  budget,
  compact,
}: {
  spent: number;
  budget: number | null;
  compact?: boolean;
}) {
  const percent = budgetPercent(spent, budget);
  const level = budgetLevel(spent, budget);
  if (percent == null || budget == null) {
    return <Text style={styles.muted}>Sin presupuesto · {formatMoney(spent)} gastados</Text>;
  }
  const width = `${Math.min(percent, 1) * 100}%` as `${number}%`;
  const color = level === 'exceeded' ? theme.danger : level === 'warning' ? '#D97706' : theme.primary;
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[styles.caption, level === 'exceeded' && { color: theme.danger }, level === 'warning' && { color: theme.warning }]}>
        {formatMoney(spent)} de {formatMoney(budget)} · {formatPercent(percent)}
        {compact ? '' : level === 'exceeded' ? ' · superado' : level === 'warning' ? ' · cerca del límite' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: { height: 10, borderRadius: 99, backgroundColor: '#E5EEEb', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 99 },
  caption: { fontSize: 13, color: theme.muted, fontWeight: '600' },
  muted: { fontSize: 13, color: theme.muted },
});
