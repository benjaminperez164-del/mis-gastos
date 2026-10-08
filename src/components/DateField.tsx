import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { addMonths, daysInMonth, formatDate, formatMonth, isValidDate, monthOf } from '@/src/domain/dates';
import { theme } from '@/src/theme';
import { Button } from './ui';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function DateField({ value, onChange, label = 'Fecha' }: { value: string; onChange: (value: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(monthOf(value));
  const cells = useMemo(() => buildCells(cursor), [cursor]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        onPress={() => {
          setCursor(isValidDate(value) ? monthOf(value) : cursor);
          setOpen(true);
        }}
        style={styles.button}
      >
        <Text style={styles.value}>{formatDate(value)}</Text>
        <Text style={styles.change}>Cambiar</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.nav}>
              <Pressable accessibilityLabel="Año anterior" onPress={() => setCursor(addMonths(cursor, -12))} style={styles.navBtn}>
                <Text style={styles.navText}>«</Text>
              </Pressable>
              <Pressable accessibilityLabel="Mes anterior" onPress={() => setCursor(addMonths(cursor, -1))} style={styles.navBtn}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Text style={styles.month}>{formatMonth(cursor)}</Text>
              <Pressable accessibilityLabel="Mes siguiente" onPress={() => setCursor(addMonths(cursor, 1))} style={styles.navBtn}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
              <Pressable accessibilityLabel="Año siguiente" onPress={() => setCursor(addMonths(cursor, 12))} style={styles.navBtn}>
                <Text style={styles.navText}>»</Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
              {cells.map((cell, index) =>
                cell ? (
                  <Pressable
                    key={cell}
                    accessibilityLabel={formatDate(cell)}
                    onPress={() => {
                      onChange(cell);
                      setOpen(false);
                    }}
                    style={[styles.day, cell === value && styles.dayActive]}
                  >
                    <Text style={[styles.dayText, cell === value && styles.dayTextActive]}>{Number(cell.slice(8))}</Text>
                  </Pressable>
                ) : (
                  <View key={`empty-${index}`} style={styles.day} />
                ),
              )}
            </View>
            <Button
              label="Hoy"
              tone="secondary"
              onPress={() => {
                const today = new Date();
                const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                onChange(iso);
                setOpen(false);
              }}
            />
            <Button label="Cerrar" tone="ghost" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function buildCells(month: string): (string | null)[] {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const first = new Date(year, monthIndex, 1);
  const pad = (first.getDay() + 6) % 7;
  const count = daysInMonth(month);
  const cells: (string | null)[] = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, '0')}`);
  }
  return cells;
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: theme.text },
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 16, fontWeight: '700', color: theme.text },
  change: { color: theme.primary, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 33, 30, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: { backgroundColor: theme.white, borderRadius: 20, padding: 16, gap: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 22, color: theme.primary, fontWeight: '700' },
  month: { flex: 1, textAlign: 'center', fontWeight: '800', color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.28%', textAlign: 'center', color: theme.muted, fontWeight: '700', paddingVertical: 6 },
  day: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: theme.primary, borderRadius: 999 },
  dayText: { color: theme.text, fontWeight: '600' },
  dayTextActive: { color: theme.white },
});
