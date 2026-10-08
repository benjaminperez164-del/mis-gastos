import { useLocalSearchParams, useRouter } from 'expo-router';
import { defaultDateForMonth, isValidMonth, todayISO } from '@/src/domain/dates';
import { ExpenseForm } from '@/src/components/ExpenseForm';
import { Screen } from '@/src/components/ui';
import { useApp } from '@/src/state/AppContext';

export default function NuevoGasto() {
  const router = useRouter();
  const { saveExpense } = useApp();
  const params = useLocalSearchParams<{ mes?: string; proyecto?: string }>();
  const month = typeof params.mes === 'string' && isValidMonth(params.mes) ? params.mes : todayISO().slice(0, 7);
  const projectId = typeof params.proyecto === 'string' ? params.proyecto : null;

  return (
    <Screen inset="stack">
      <ExpenseForm
        defaultDate={defaultDateForMonth(month)}
        defaultProjectId={projectId}
        defaultScope={projectId ? 'proyecto' : 'personal'}
        onSubmit={async (draft) => {
          const error = await saveExpense(draft);
          if (!error) router.back();
          return error;
        }}
      />
    </Screen>
  );
}
