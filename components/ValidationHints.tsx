import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

export type ValidationItem = {
  label: string;
  ok: boolean;
};

export function missingValidationLabels(items: ValidationItem[]): string[] {
  return items.filter((item) => !item.ok).map((item) => item.label);
}

export function ValidationHints({
  items,
  title = 'Complete these to continue:',
  tone = 'warning',
  compact = false,
}: {
  items: ValidationItem[];
  title?: string;
  tone?: 'info' | 'warning' | 'success';
  compact?: boolean;
}) {
  const missing = items.filter((item) => !item.ok);
  if (missing.length === 0) return null;

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        tone === 'info' && styles.wrapInfo,
        tone === 'success' && styles.wrapSuccess,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={[styles.icon, item.ok ? styles.iconOk : styles.iconMissing]}>
            {item.ok ? '✓' : '•'}
          </Text>
          <Text style={[styles.label, item.ok && styles.labelOk]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function ValidationMessage({
  message,
  tone = 'info',
}: {
  message: string;
  tone?: 'info' | 'warning' | 'success';
}) {
  return (
    <View
      style={[
        styles.messageWrap,
        tone === 'warning' && styles.wrapWarning,
        tone === 'success' && styles.wrapSuccess,
        tone === 'info' && styles.wrapInfo,
      ]}
    >
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  wrapCompact: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  wrapInfo: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: colors.accentSoft,
  },
  wrapSuccess: {
    borderColor: 'rgba(52, 211, 153, 0.35)',
    backgroundColor: colors.successSoft,
  },
  wrapWarning: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: colors.warningSoft,
  },
  messageWrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 14,
    lineHeight: 20,
    width: 16,
    textAlign: 'center',
  },
  iconOk: { color: colors.success },
  iconMissing: { color: colors.warning },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  labelOk: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  messageText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
