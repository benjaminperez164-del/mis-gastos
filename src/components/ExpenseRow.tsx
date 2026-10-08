import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate } from '@/src/domain/dates';
import { formatMoney } from '@/src/domain/money';
import type { Expense } from '@/src/domain/types';
import { shadow, theme } from '@/src/theme';
import { Badge } from './ui';

export function ExpenseRow({
  expense,
  typeName,
  projectName,
  onPress,
}: {
  expense: Expense;
  typeName?: string | null;
  projectName?: string | null;
  onPress: () => void;
}) {
  const pending = expense.status === 'por_confirmar';
  const meta = [formatDate(expense.date), typeName, projectName].filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={[styles.bar, { backgroundColor: expense.scope === 'personal' ? theme.primary : theme.project }]} />
      <View style={styles.body}>
        <Text style={styles.title}>{expense.description}</Text>
        <Text style={styles.meta}>{meta}</Text>
        {pending ? <Badge tone="warning">Por confirmar</Badge> : null}
      </View>
      <Text style={styles.amount}>{formatMoney(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    backgroundColor: theme.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow,
  },
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 99 },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: theme.text },
  meta: { fontSize: 13, color: theme.muted },
  amount: { fontSize: 16, fontWeight: '800', color: theme.text },
});
