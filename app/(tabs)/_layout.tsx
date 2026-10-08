import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Fab } from '@/src/components/Fab';
import { theme } from '@/src/theme';

export default function TabsLayout() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: '#7A8F8A',
          tabBarStyle: {
            backgroundColor: theme.white,
            borderTopColor: theme.line,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="proyectos"
          options={{
            title: 'Proyectos',
            tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="proformas"
          options={{
            title: 'Proformas',
            tabBarIcon: ({ color, size }) => <Ionicons name="documents" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="reportes"
          options={{
            title: 'Reportes',
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="ajustes"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
          }}
        />
      </Tabs>
      <Fab onPress={() => router.push('/gasto/nuevo')} />
    </View>
  );
}
