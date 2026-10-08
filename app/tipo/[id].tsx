import { useLocalSearchParams, useRouter } from 'expo-router';
import { TypeForm } from '@/src/components/TypeForm';
import { Empty, Screen } from '@/src/components/ui';
import { useApp } from '@/src/state/AppContext';

export default function TipoDetalle() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, saveType, archiveType, deleteType } = useApp();
  const type = data.types.find((item) => item.id === id);
  if (!type) {
    return (
      <Screen inset="stack">
        <Empty title="Ese tipo ya no está" />
      </Screen>
    );
  }
  return (
    <Screen inset="stack">
      <TypeForm
        initial={type}
        onSubmit={async (draft) => {
          const error = await saveType(draft);
          if (!error) router.back();
          return error;
        }}
        onArchive={async (archived) => {
          const error = await archiveType(type.id, archived);
          if (!error) router.back();
          return error;
        }}
        onDelete={async () => {
          const error = await deleteType(type.id);
          if (!error) router.back();
          return error;
        }}
      />
    </Screen>
  );
}
