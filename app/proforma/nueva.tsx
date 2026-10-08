import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProformaForm } from '@/src/components/ProformaForm';
import { Screen } from '@/src/components/ui';
import { useApp } from '@/src/state/AppContext';

export default function NuevaProforma() {
  const router = useRouter();
  const { saveProforma } = useApp();
  const params = useLocalSearchParams<{ proyecto?: string }>();
  const projectId = typeof params.proyecto === 'string' ? params.proyecto : null;

  return (
    <Screen inset="stack">
      <ProformaForm
        defaultProjectId={projectId}
        onSubmit={async (draft) => {
          const error = await saveProforma(draft);
          if (!error) router.back();
          return error;
        }}
      />
    </Screen>
  );
}
