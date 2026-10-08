import { useRouter } from 'expo-router';
import { TypeForm } from '@/src/components/TypeForm';
import { Screen } from '@/src/components/ui';
import { useApp } from '@/src/state/AppContext';

export default function NuevoTipo() {
  const router = useRouter();
  const { saveType } = useApp();
  return (
    <Screen inset="stack">
      <TypeForm
        onSubmit={async (draft) => {
          const error = await saveType(draft);
          if (!error) router.back();
          return error;
        }}
      />
    </Screen>
  );
}
