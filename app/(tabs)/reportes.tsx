import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { addMonths, currentMonth, formatMonthShort, isValidMonth } from '@/src/domain/dates';
import { monthsInRange } from '@/src/domain/dates';
import { totalsByMonth, totalsByProject, totalsByType } from '@/src/domain/reports';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';
import { HBars, MonthBars } from '@/src/components/Charts';
import { MonthSwitcher } from '@/src/components/MonthSwitcher';
import { Button, Card, Empty, ErrorText, PageTitle, Screen, SectionTitle, Segmented } from '@/src/components/ui';

export default function Reportes() {
  const { data, exportCsv } = useApp();
  const [month, setMonth] = useState(currentMonth());
  const [projectRange, setProjectRange] = useState<'mes' | 'todo'>('todo');
  const [error, setError] = useState<string | null>(null);
  const safeMonth = isValidMonth(month) ? month : currentMonth();
  const months = monthsInRange(addMonths(safeMonth, -5), safeMonth);
  const byMonth = totalsByMonth(data.expenses, months);
  const byType = totalsByType(data.expenses, data.types, safeMonth);
  const byProject = totalsByProject(data.expenses, data.projects, projectRange === 'mes' ? safeMonth : null);
  const hasMonth = byMonth.some((row) => row.total > 0);

  return (
    <Screen>
      <PageTitle title="Reportes" subtitle="Totales confirmados. Los pendientes no se incluyen." />
      <Button
        label="Exportar todo a CSV"
        icon="download-outline"
        onPress={() => void exportCsv().then((message) => setError(message))}
      />
      <ErrorText>{error}</ErrorText>
      <SectionTitle>Por mes</SectionTitle>
      <Card>
        {hasMonth ? (
          <MonthBars
            rows={byMonth.map((row) => ({
              label: formatMonthShort(row.month),
              personal: row.personal,
              project: row.project,
            }))}
          />
        ) : (
          <Text style={styles.empty}>Todavía no hay gastos confirmados en estos meses.</Text>
        )}
      </Card>
      <SectionTitle>Por tipo</SectionTitle>
      <MonthSwitcher month={safeMonth} onChange={setMonth} />
      <Card>
        {byType.length === 0 ? (
          <Text style={styles.empty}>Sin gastos confirmados en este mes.</Text>
        ) : (
          <HBars rows={byType.map((row) => ({ label: row.label, total: row.total }))} />
        )}
      </Card>
      <SectionTitle>Por proyecto</SectionTitle>
      <Segmented
        options={[
          { value: 'todo' as const, label: 'Todo' },
          { value: 'mes' as const, label: 'Este mes' },
        ]}
        value={projectRange}
        onChange={setProjectRange}
      />
      <Card>
        {byProject.length === 0 ? (
          <Empty title="Sin gastos de proyecto" body="Los proyectos acumulan lo confirmado, aunque cruce varios meses." />
        ) : (
          <HBars rows={byProject.map((row) => ({ label: row.label, total: row.total }))} color={theme.project} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: theme.muted, fontSize: 15 },
});
