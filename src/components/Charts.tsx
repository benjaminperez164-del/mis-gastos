import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { formatMoney } from '@/src/domain/money';
import { theme } from '@/src/theme';

export function MonthBars({
  rows,
}: {
  rows: { label: string; personal: number; project: number }[];
}) {
  const [width, setWidth] = useState(320);
  const height = 140;
  const max = Math.max(1, ...rows.map((row) => row.personal + row.project));
  const slot = width / Math.max(rows.length, 1);
  const barWidth = Math.min(26, slot * 0.5);

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Svg width={width} height={height + 28}>
        {rows.map((row, index) => {
          const total = row.personal + row.project;
          const barHeight = (total / max) * (height - 8);
          const personalHeight = total === 0 ? 0 : (row.personal / total) * barHeight;
          const projectHeight = barHeight - personalHeight;
          const x = slot * index + (slot - barWidth) / 2;
          const y = height - barHeight;
          return (
            <G key={`${row.label}-${index}`}>
              {projectHeight > 0 ? (
                <Rect x={x} y={y} width={barWidth} height={projectHeight} rx={6} fill={theme.project} />
              ) : null}
              {personalHeight > 0 ? (
                <Rect
                  x={x}
                  y={y + projectHeight}
                  width={barWidth}
                  height={personalHeight}
                  rx={6}
                  fill={theme.primary}
                />
              ) : null}
              <SvgText x={x + barWidth / 2} y={height + 16} fontSize="10" fill={theme.muted} textAnchor="middle">
                {row.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Legend color={theme.primary} label="Personal" />
        <Legend color={theme.project} label="Proyectos" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export function HBars({ rows, color = theme.primary }: { rows: { label: string; total: number }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.total));
  return (
    <View style={styles.bars}>
      {rows.map((row) => (
        <View key={row.label} style={styles.barRow}>
          <View style={styles.barLabels}>
            <Text style={styles.barLabel}>{row.label}</Text>
            <Text style={styles.barValue}>{formatMoney(row.total)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(row.total / max) * 100}%` as `${number}%`, backgroundColor: color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 99 },
  legendText: { color: theme.muted, fontWeight: '600', fontSize: 13 },
  bars: { gap: 12 },
  barRow: { gap: 6 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  barLabel: { flex: 1, color: theme.text, fontWeight: '700' },
  barValue: { color: theme.muted, fontWeight: '700' },
  track: { height: 10, borderRadius: 99, backgroundColor: '#E5EEEb', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 99 },
});
