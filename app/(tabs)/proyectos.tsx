import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { projectBudgetView } from '@/src/domain/budgets';
import { useApp } from '@/src/state/AppContext';
import { shadow, theme } from '@/src/theme';
import { BudgetBar } from '@/src/components/BudgetBar';
import { Badge, Button, Empty, PageTitle, Screen } from '@/src/components/ui';

export default function Proyectos() {
  const router = useRouter();
  const { data } = useApp();
  const projects = data.projects
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'activo' ? -1 : 1;
      return a.name.localeCompare(b.name, 'es');
    });

  return (
    <Screen>
      <PageTitle title="Proyectos" subtitle="Un proyecto junta gastos de muchos meses. No está atado al calendario." />
      <Button label="Nuevo proyecto" icon="add" onPress={() => router.push('/proyecto/nuevo')} />
      {projects.length === 0 ? (
        <Empty title="Todavía no hay proyectos" body="Por ejemplo: una remodelación, un viaje o un encargo." />
      ) : (
        projects.map((project) => {
          const view = projectBudgetView(project, data.expenses);
          return (
            <Pressable key={project.id} accessibilityRole="button" onPress={() => router.push(`/proyecto/${project.id}`)} style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.name}>{project.name}</Text>
                <Badge tone={project.status === 'activo' ? 'ok' : 'neutral'}>
                  {project.status === 'activo' ? 'Activo' : 'Cerrado'}
                </Badge>
              </View>
              <BudgetBar spent={view.spent} budget={project.budget} />
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.white, borderRadius: 18, padding: 16, gap: 10, ...shadow },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 18, fontWeight: '800', color: theme.text },
});
