import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { projectBudgetView } from '@/src/domain/budgets';
import { formatMonth } from '@/src/domain/dates';
import { formatMoney } from '@/src/domain/money';
import { projectMonthBreakdown, projectTypeBreakdown } from '@/src/domain/reports';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';
import { BudgetBar } from '@/src/components/BudgetBar';
import { HBars } from '@/src/components/Charts';
import { ExpenseRow } from '@/src/components/ExpenseRow';
import { Badge, Button, Card, ConfirmDialog, Empty, ErrorText, Screen, SectionTitle } from '@/src/components/ui';

export default function ProyectoDetalle() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, setProjectStatus, deleteProject } = useApp();
  const project = data.projects.find((item) => item.id === id);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!project) {
    return (
      <Screen inset="stack">
        <Empty title="Ese proyecto ya no está" />
      </Screen>
    );
  }

  const view = projectBudgetView(project, data.expenses);
  const byMonth = projectMonthBreakdown(data.expenses, project.id);
  const byType = projectTypeBreakdown(data.expenses, data.types, project.id);
  const expenses = data.expenses
    .filter((expense) => expense.projectId === project.id && expense.status === 'confirmado')
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Screen inset="stack">
      <Badge tone={project.status === 'activo' ? 'ok' : 'neutral'}>{project.status === 'activo' ? 'Activo' : 'Cerrado'}</Badge>
      <Text style={styles.name}>{project.name}</Text>
      <Text style={styles.total}>{formatMoney(view.spent)}</Text>
      <Text style={styles.meta}>Total gastado, sumando todos los meses</Text>
      <Card>
        <BudgetBar spent={view.spent} budget={project.budget} />
      </Card>
      <Button label="Registrar gasto" icon="add" onPress={() => router.push(`/gasto/nuevo?proyecto=${project.id}`)} />
      <Button label="Nueva proforma" tone="secondary" onPress={() => router.push(`/proforma/nueva?proyecto=${project.id}`)} />
      <Button label="Ver proformas" tone="ghost" onPress={() => router.push(`/proformas?proyecto=${project.id}`)} />
      <SectionTitle>Por mes</SectionTitle>
      {byMonth.length === 0 ? (
        <Text style={styles.meta}>Todavía no hay gastos confirmados.</Text>
      ) : (
        <Card>
          <HBars
            rows={byMonth.map((row) => ({ label: formatMonth(row.month), total: row.total }))}
            color={theme.project}
          />
        </Card>
      )}
      <SectionTitle>Por tipo</SectionTitle>
      {byType.length === 0 ? (
        <Text style={styles.meta}>Los gastos sin tipo aparecen cuando confirmes alguno.</Text>
      ) : (
        <Card>
          <HBars rows={byType.map((row) => ({ label: row.label, total: row.total }))} color={theme.project} />
        </Card>
      )}
      <SectionTitle>Gastos</SectionTitle>
      {expenses.length === 0 ? (
        <Empty title="Sin gastos confirmados" />
      ) : (
        expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            typeName={data.types.find((type) => type.id === expense.typeId)?.name}
            onPress={() => router.push(`/gasto/${expense.id}`)}
          />
        ))
      )}
      <Button label="Editar" tone="secondary" onPress={() => router.push(`/proyecto/nuevo?id=${project.id}`)} />
      <Button
        label={project.status === 'activo' ? 'Cerrar proyecto' : 'Reabrir proyecto'}
        tone="ghost"
        onPress={() =>
          void setProjectStatus(project.id, project.status === 'activo' ? 'cerrado' : 'activo').then((message) =>
            message ? setError(message) : undefined,
          )
        }
      />
      <Button label="Eliminar" tone="danger" onPress={() => setConfirmDelete(true)} />
      <ErrorText>{error}</ErrorText>
      <ConfirmDialog
        visible={confirmDelete}
        title="Eliminar proyecto"
        message="Solo se puede eliminar si no tiene gastos ni proformas. Si ya tiene movimientos, ciérralo."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void deleteProject(project.id).then((message) => {
            if (message) setError(message);
            else router.back();
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 28, fontWeight: '800', color: theme.text },
  total: { fontSize: 32, fontWeight: '800', color: theme.project },
  meta: { color: theme.muted, fontSize: 14 },
});
