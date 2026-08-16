import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api, User } from '../lib/api';
import { formatCurrencyMonthly, formatPlanName, formatSubscriptionExpiry } from '../lib/format';
import { roleLabel } from '../lib/roles';
import { colors, radius, spacing } from '../lib/theme';
import { ToastTone } from '../lib/useToast';
import { ValidationHints } from './ValidationHints';
import { Badge, Button, GlassCard, Input, SectionTitle } from './ui';

function daysUntilExpiry(iso?: string): number | null {
  if (!iso) return null;
  const expiry = new Date(iso).getTime();
  if (Number.isNaN(expiry)) return null;
  return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
}

export function SettingsPanel({
  user,
  token,
  submitting,
  onEditProfile,
  onActivate,
  onRefresh,
  onNotify,
}: {
  user: User;
  token: string;
  submitting: boolean;
  onEditProfile: () => void;
  onActivate: () => void;
  onRefresh: () => void;
  onNotify?: (message: string, tone: ToastTone) => void;
}) {
  const daysLeft = daysUntilExpiry(user.subscriptionExpiresAt);
  const expiryLabel = formatSubscriptionExpiry(user.subscriptionExpiresAt);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      onNotify?.('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify?.('New password and confirmation do not match.', 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await api.changePassword(token, {
        currentPassword,
        newPassword,
      });
      onNotify?.(result.message, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      onNotify?.(err instanceof Error ? err.message : 'Could not update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <GlassCard>
        <SectionTitle title="Account" subtitle={user.email} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{roleLabel(user.role)} · @{user.username}</Text>
        <Button title="Edit profile" onPress={onEditProfile} variant="secondary" compact />
      </GlassCard>

      <GlassCard>
        <SectionTitle
          title="Change password"
          subtitle="Update the temporary password from your approval email"
        />
        <Input
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          title="Update password"
          onPress={handleChangePassword}
          loading={passwordLoading}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        />
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Subscription" />
        <View style={styles.statusRow}>
          <Badge
            label={user.subscriptionActive ? 'Active' : 'Inactive'}
            tone={user.subscriptionActive ? 'success' : 'warning'}
          />
          {user.subscriptionPlan ? (
            <Badge label={formatPlanName(user.subscriptionPlan)} tone="accent" />
          ) : null}
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Current plan</Text>
          <Text style={styles.detailValue}>
            {user.subscriptionPlan ? formatPlanName(user.subscriptionPlan) : 'Not selected'}
          </Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Valid until</Text>
          <Text style={styles.detailValue}>{expiryLabel}</Text>
          {user.subscriptionActive && daysLeft != null && daysLeft >= 0 ? (
            <Text style={styles.detailHint}>
              {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
            </Text>
          ) : null}
          {user.subscriptionActive && daysLeft != null && daysLeft < 0 ? (
            <Text style={[styles.detailHint, styles.expiredHint]}>Subscription expired</Text>
          ) : null}
        </View>

        {!user.subscriptionActive ? (
          <View style={styles.actions}>
            <Text style={styles.inactiveNote}>
              Activate your plan to post listings and express interest.
            </Text>
            {user.subscriptionPlan ? (
              <Text style={styles.priceHint}>{formatCurrencyMonthly(19)}/mo</Text>
            ) : (
              <ValidationHints
                tone="info"
                title="Plan not selected yet:"
                items={[
                  { label: 'Register on the website and pick a subscription plan', ok: false },
                  { label: 'Return here and tap Refresh status', ok: false },
                ]}
              />
            )}
            <Button
              title="Activate subscription"
              onPress={onActivate}
              loading={submitting}
              disabled={!user.subscriptionPlan}
            />
            <Button title="Refresh status" onPress={onRefresh} variant="secondary" />
          </View>
        ) : (
          <Button title="Refresh plan status" onPress={onRefresh} variant="ghost" compact />
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  name: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.xs },
  role: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  detailBlock: { marginBottom: spacing.md },
  detailLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs },
  detailValue: { color: colors.text, fontSize: 16, fontWeight: '600' },
  detailHint: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  expiredHint: { color: colors.error },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  inactiveNote: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  priceHint: { color: colors.accent, fontWeight: '700', fontSize: 16 },
});
