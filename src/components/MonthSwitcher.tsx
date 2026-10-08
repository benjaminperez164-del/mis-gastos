import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addMonths, formatMonth } from '@/src/domain/dates';
import { theme } from '@/src/theme';

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        onPress={() => onChange(addMonths(month, -1))}
        style={styles.button}
      >
        <Ionicons name="chevron-back" size={22} color={theme.primaryDark} />
      </Pressable>
      <Text style={styles.title}>{formatMonth(month)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        onPress={() => onChange(addMonths(month, 1))}
        style={styles.button}
      >
        <Ionicons name="chevron-forward" size={22} color={theme.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '800', color: theme.text },
  button: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
