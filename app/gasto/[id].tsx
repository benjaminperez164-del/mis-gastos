import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { ExpenseForm } from '@/src/components/ExpenseForm';
import { Empty, Screen } from '@/src/components/ui';
import { useApp } from '@/src/state/AppContext';
import { theme } from '@/src/theme';

export default function GastoDetalle() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, saveExpense, deleteExpense } = useApp();
  const expense = data.expenses.find((item) => item.id === id);

  if (!expense) {
    return (
      <Screen inset="stack">
        <Empty title="Ese gasto ya no está" />
      </Screen>
    );
  }

  return (
    <Screen inset="stack">
      <Stack.Screen options={{ title: expense.status === 'por_confirmar' ? 'Confirmar gasto' : 'Editar gasto' }} />
      {expense.proformaId ? (
        <Text style={{ color: theme.primary, fontWeight: '700' }} onPress={() => router.push(`/proforma/${expense.proformaId}`)}>
          Ver proforma
        </Text>
      ) : null}
      <ExpenseForm
        initial={expense}
        defaultDate={expense.date}
        onSubmit={async (draft) => {
          const error = await saveExpense(draft);
          if (!error) router.back();
          return error;
        }}
        onDelete={async () => {
          const error = await deleteExpense(expense.id);
          if (!error) router.back();
          return error;
        }}
      />
    </Screen>
  );
}
