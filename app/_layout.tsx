import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BASE_PATH } from '@/src/config';
import { AppProvider } from '@/src/state/AppContext';
import { theme } from '@/src/theme';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web' || process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: theme.frame, alignItems: 'center' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 480, backgroundColor: theme.bg }}>
            <AppProvider>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: theme.bg },
                  headerTintColor: theme.primary,
                  headerTitleStyle: { fontWeight: '700', color: theme.text },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: theme.bg },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Inicio' }} />
                <Stack.Screen name="gasto/nuevo" options={{ title: 'Nuevo gasto', presentation: 'modal' }} />
                <Stack.Screen name="gasto/[id]" options={{ title: 'Gasto' }} />
                <Stack.Screen name="proyecto/nuevo" options={{ title: 'Proyecto', presentation: 'modal' }} />
                <Stack.Screen name="proyecto/[id]" options={{ title: 'Proyecto' }} />
                <Stack.Screen name="proforma/nueva" options={{ title: 'Nueva proforma', presentation: 'modal' }} />
                <Stack.Screen name="proforma/[id]" options={{ title: 'Proforma' }} />
                <Stack.Screen name="proforma/comparar" options={{ title: 'Comparar' }} />
                <Stack.Screen name="tipo/nuevo" options={{ title: 'Nuevo tipo', presentation: 'modal' }} />
                <Stack.Screen name="tipo/[id]" options={{ title: 'Tipo de gasto' }} />
              </Stack>
            </AppProvider>
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
