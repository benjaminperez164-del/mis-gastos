import { useRouter } from 'expo-router';
import { Button, Empty, Screen } from '@/src/components/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen inset="stack">
      <Empty title="No encontramos esa pantalla" body="Vuelve al inicio para seguir con tus gastos." />
      <Button label="Ir al inicio" onPress={() => router.replace('/')} />
    </Screen>
  );
}
