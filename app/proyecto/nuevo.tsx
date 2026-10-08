import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ProjectForm } from '@/src/components/ProjectForm';
import { Screen } from '@/src/components/ui';
import { useApp } from '@/src/state/AppContext';

export default function ProyectoFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, saveProject } = useApp();
  const project = data.projects.find((item) => item.id === id);

  return (
    <Screen inset="stack">
      <Stack.Screen options={{ title: project ? 'Editar proyecto' : 'Nuevo proyecto' }} />
      <ProjectForm
        initial={project}
        onSubmit={async (draft) => {
          const error = await saveProject(draft);
          if (!error) router.back();
          return error;
        }}
      />
    </Screen>
  );
}
