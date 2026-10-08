import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';
import { inputReset, shadow, theme } from '@/src/theme';

export function Screen({
  children,
  inset = 'tabs',
  scroll = true,
}: {
  children: ReactNode;
  inset?: 'tabs' | 'stack';
  scroll?: boolean;
}) {
  const edges: Edges = inset === 'tabs' ? ['top', 'left', 'right'] : ['left', 'right'];
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Card({
  children,
  tone = 'default',
  style,
}: {
  children: ReactNode;
  tone?: 'default' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'warning' && styles.cardWarning,
        tone === 'danger' && styles.cardDanger,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'primary' && styles.buttonPrimary,
        tone === 'secondary' && styles.buttonSecondary,
        tone === 'danger' && styles.buttonDanger,
        tone === 'ghost' && styles.buttonGhost,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={tone === 'primary' || tone === 'danger' ? theme.white : theme.primary}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          tone === 'secondary' && styles.buttonTextDark,
          tone === 'ghost' && styles.buttonTextDark,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: 'neutral' | 'warning' | 'danger' | 'ok' | 'project';
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'warning' && { backgroundColor: theme.warningSoft },
        tone === 'danger' && { backgroundColor: theme.dangerSoft },
        tone === 'ok' && { backgroundColor: theme.okSoft },
        tone === 'project' && { backgroundColor: theme.projectSoft },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === 'warning' && { color: theme.warning },
          tone === 'danger' && { color: theme.danger },
          tone === 'ok' && { color: theme.ok },
          tone === 'project' && { color: theme.project },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  hint,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <Field label={label} hint={hint}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8AA09B"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, inputReset, multiline && styles.multiline]}
      />
    </Field>
  );
}

export function AmountField({
  label,
  value,
  onChangeText,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <Field label={label} hint="Puedes escribir 12,50 o 12.50">
      <View style={[styles.amountWrap, !editable && styles.disabled]}>
        <Text style={styles.dollar}>$</Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#8AA09B"
          style={[styles.amountInput, inputReset]}
        />
      </View>
    </Field>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.segmentItem, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            onPress={() => onChange(option.id)}
            style={[styles.choice, active && styles.choiceActive]}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Empty({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.subtitle}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} tone="secondary" /> : null}
    </View>
  );
}

export function Banner({
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerText}>{message}</Text>
      <View style={styles.bannerActions}>
        <Button label={actionLabel} onPress={onAction} icon="share-outline" />
        <Button label="Ahora no" onPress={onDismiss} tone="ghost" />
      </View>
    </View>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.subtitle}>{message}</Text>
          {busy ? <ActivityIndicator color={theme.primary} /> : null}
          <Button label={confirmLabel} tone={danger ? 'danger' : 'primary'} onPress={onConfirm} disabled={busy} />
          <Button label="Cancelar" tone="ghost" onPress={onCancel} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}

export function LoadingBlock({ label = 'Guardando…' }: { label?: string }) {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={theme.primary} />
      <Text style={styles.hint}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  titleBlock: { gap: 4, marginBottom: 4 },
  pageTitle: { fontSize: 30, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 21, color: theme.muted },
  section: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 8 },
  card: { backgroundColor: theme.card, borderRadius: theme.radius, padding: 16, gap: 8, ...shadow },
  cardWarning: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  cardDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonPrimary: { backgroundColor: theme.primary },
  buttonSecondary: { backgroundColor: theme.primarySoft },
  buttonDanger: { backgroundColor: theme.danger },
  buttonGhost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.72 },
  buttonText: { color: theme.white, fontSize: 16, fontWeight: '700' },
  buttonTextDark: { color: theme.primaryDark },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: theme.primaryDark, fontSize: 12, fontWeight: '700' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: theme.text },
  hint: { fontSize: 13, color: theme.muted, lineHeight: 18 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  amountWrap: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dollar: { fontSize: 28, fontWeight: '800', color: theme.primary, marginRight: 6 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '800', color: theme.text, paddingVertical: 8 },
  disabled: { opacity: 0.6 },
  segment: { flexDirection: 'row', backgroundColor: '#E7EFEC', borderRadius: 14, padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: theme.white, ...shadow },
  segmentText: { fontSize: 15, fontWeight: '700', color: theme.muted },
  segmentTextActive: { color: theme.primaryDark },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  choiceText: { color: theme.text, fontWeight: '700' },
  choiceTextActive: { color: theme.white },
  empty: {
    backgroundColor: theme.white,
    borderRadius: theme.radius,
    padding: 20,
    gap: 8,
    alignItems: 'flex-start',
    ...shadow,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
  banner: { backgroundColor: '#FEF3C7', borderRadius: theme.radius, padding: 16, gap: 8 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#92400E' },
  bannerText: { fontSize: 14, lineHeight: 20, color: '#92400E' },
  bannerActions: { gap: 4 },
  error: { color: theme.danger, fontSize: 14, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 33, 30, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: theme.white, borderRadius: 20, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
