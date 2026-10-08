import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { personalBudgetAlerts } from '@/src/domain/budgets';
import { currentMonth, isValidMonth } from '@/src/domain/dates';
import { formatMoney } from '@/src/domain/money';
import { summarizeMonth } from '@/src/domain/months';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';
import { BudgetBar } from '@/src/components/BudgetBar';
import { ExpenseRow } from '@/src/components/ExpenseRow';
import { MonthSwitcher } from '@/src/components/MonthSwitcher';
import { Banner, Button, Card, Empty, ErrorText, Screen, SectionTitle } from '@/src/components/ui';

export default function Inicio() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mes?: string }>();
  const { data, reminder, ensureMonth, shareBackup, dismissReminder } = useApp();
  const requested = typeof params.mes === 'string' ? params.mes : '';
  const month = isValidMonth(requested) ? requested : currentMonth();
  const ensureRef = useRef(ensureMonth);
  ensureRef.current = ensureMonth;
  const [backupError, setBackupError] = useState<string | null>(null);

  useEffect(() => {
    void ensureRef.current(month);
  }, [month]);

  const summary = summarizeMonth(data.expenses, month);
  const alerts = personalBudgetAlerts(data.types, data.expenses, month);

  return (
    <Screen>
      <MonthSwitcher month={month} onChange={(next) => router.setParams({ mes: next })} />
      {month !== currentMonth() ? (
        <Button label="Ir al mes actual" tone="ghost" onPress={() => router.setParams({ mes: currentMonth() })} />
      ) : null}
      {reminder ? (
        <Banner
          title={reminder.title}
          message={reminder.message}
          actionLabel="Compartir respaldo"
          onAction={() => void shareBackup().then((message) => setBackupError(message))}
          onDismiss={() => void dismissReminder()}
        />
      ) : null}
      <ErrorText>{backupError}</ErrorText>
      <LinearGradient colors={['#0F766E', '#115E59']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroLabel}>Total confirmado</Text>
        <Text style={styles.heroAmount}>{formatMoney(summary.confirmedTotal)}</Text>
        <View style={styles.heroSplit}>
          <Text style={styles.heroMeta}>Personal {formatMoney(summary.personalTotal)}</Text>
          <Text style={styles.heroMeta}>Proyectos {formatMoney(summary.projectTotal)}</Text>
        </View>
        <Text style={styles.heroNote}>Los pendientes no entran en el total hasta confirmarlos.</Text>
      </LinearGradient>
      {alerts.length > 0 ? (
        <>
          <SectionTitle>Presupuestos</SectionTitle>
          {alerts.map((alert) => (
            <Card key={alert.type.id} tone={alert.level === 'exceeded' ? 'danger' : 'warning'}>
              <Text style={styles.alertTitle}>
                {alert.level === 'exceeded' ? 'Presupuesto superado' : 'Vas por el 80% o más'}
              </Text>
              <Text style={styles.alertName}>{alert.type.name}</Text>
              <BudgetBar spent={alert.spent} budget={alert.type.budget} />
            </Card>
          ))}
        </>
      ) : null}
      {summary.pending.length > 0 ? (
        <>
          <SectionTitle>Por confirmar</SectionTitle>
          {summary.pending.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              typeName={data.types.find((type) => type.id === expense.typeId)?.name}
              onPress={() => router.push(`/gasto/${expense.id}`)}
            />
          ))}
        </>
      ) : null}
      <SectionTitle>Gastos del mes</SectionTitle>
      {summary.confirmed.length === 0 ? (
        <Empty
          title={summary.pending.length ? 'Nada confirmado todavía' : 'Aún no hay gastos en este mes'}
          body={
            summary.pending.length
              ? 'Confirma los estimados de arriba para que entren en el total.'
              : 'Cuando llegue un mes nuevo, la vista aparece sola. Los recurrentes quedan por confirmar.'
          }
          actionLabel="Registrar gasto"
          onAction={() => router.push(`/gasto/nuevo?mes=${month}`)}
        />
      ) : (
        summary.confirmed.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            typeName={data.types.find((type) => type.id === expense.typeId)?.name}
            projectName={data.projects.find((project) => project.id === expense.projectId)?.name}
            onPress={() => router.push(`/gasto/${expense.id}`)}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 20, gap: 6 },
  heroLabel: { color: '#D1FAE5', fontWeight: '700' },
  heroAmount: { color: theme.white, fontSize: 36, fontWeight: '800' },
  heroSplit: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  heroMeta: { color: theme.white, fontWeight: '700', flex: 1 },
  heroNote: { color: '#CCFBF1', fontSize: 13, marginTop: 4 },
  alertTitle: { fontWeight: '800', color: theme.text },
  alertName: { color: theme.muted, fontWeight: '600' },
});
