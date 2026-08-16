import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ValidationHints } from '../components/ValidationHints';
import { Button, GlowBackground, LoadingScreen, SignOutConfirm, Toast } from '../components/ui';
import { api } from '../lib/api';
import { routeAfterAuth } from '../lib/authFlow';
import { formatCurrencyMonthly } from '../lib/format';
import { clearToken, getToken } from '../lib/storage';
import { User } from '../lib/types';
import { colors, radius, spacing } from '../lib/theme';
import { useToast } from '../lib/useToast';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export default function BillingScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { toast, notify, dismiss } = useToast();

  async function loadUser(accessToken: string) {
    const me = await api.me(accessToken);
    setUser(me);
    if (me.subscriptionActive && me.role !== 'admin') {
      routeAfterAuth(me, router);
    }
  }

  useEffect(() => {
    getToken().then(async (accessToken) => {
      if (!accessToken) {
        router.replace('/');
        return;
      }
      setToken(accessToken);
      try {
        await loadUser(accessToken);
      } catch {
        await clearToken();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function handleCheckout() {
    if (!token || !user?.subscriptionPlan) return;
    setSubmitting(true);
    try {
      const checkout = await api.createCheckout(token, user.subscriptionPlan);
      if (checkout.mock) {
        await loadUser(token);
        notify('Subscription activated successfully!', 'success');
        return;
      }
      if (checkout.url) {
        await Linking.openURL(checkout.url);
        notify('Complete payment in the browser, then tap Refresh status.', 'info');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Payment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefresh() {
    if (!token) return;
    setSubmitting(true);
    try {
      const me = await api.me(token);
      setUser(me);
      if (me.subscriptionActive) {
        notify('Subscription is active!', 'success');
        if (me.role !== 'admin') {
          routeAfterAuth(me, router);
        }
      } else {
        notify('Subscription is not active yet.', 'info');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not refresh status', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function performLogout() {
    await clearToken();
    router.replace('/');
  }

  if (loading || !user) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <GlowBackground />
      <View style={styles.content}>
        {toast ? (
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        ) : null}

        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>Hi, {user.name.split(' ')[0]}</Text>

        {user.subscriptionActive ? (
          <View style={styles.activeCard}>
            <View style={styles.activeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeLabel}>Active</Text>
            </View>
            <Text style={styles.planName}>{user.subscriptionPlan}</Text>
            {user.subscriptionExpiresAt ? (
              <Text style={styles.expires}>
                Expires {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
              </Text>
            ) : null}
            <Button title="Go to app" onPress={() => router.replace('/dashboard')} />
          </View>
        ) : (
          <View style={styles.inactiveCard}>
            <Text style={styles.inactiveText}>
              Complete payment to unlock posting listings, expressing interest, and full contact details.
            </Text>
            <Text style={styles.planHint}>
              Plan: {user.subscriptionPlan ?? 'Not selected — register on the website first'}
            </Text>
            {user.subscriptionPlan ? (
              <Text style={styles.priceHint}>{formatCurrencyMonthly(19)}/mo</Text>
            ) : (
              <ValidationHints
                tone="info"
                title="Before you can activate:"
                items={[
                  { label: 'Register on the website and choose a plan', ok: false },
                  { label: 'Sign in here with the same account', ok: false },
                ]}
              />
            )}
            <Button
              title={submitting ? 'Processing...' : 'Activate subscription'}
              onPress={handleCheckout}
              loading={submitting}
              disabled={!user.subscriptionPlan}
            />
            <Button title="Refresh status" onPress={handleRefresh} variant="secondary" />
          </View>
        )}

        <Text style={styles.footer}>
          New user? Register at {WEB_URL.replace(/^https?:\/\//, '')}
        </Text>
        <Button title="Sign out" onPress={() => setSignOutOpen(true)} variant="ghost" />
      </View>
      <SignOutConfirm
        visible={signOutOpen}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          void performLogout();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 16 },
  activeCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: colors.successSoft,
    padding: spacing.xl,
    gap: spacing.md,
  },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  activeLabel: { color: colors.success, fontWeight: '700', fontSize: 16 },
  planName: { color: colors.text, fontWeight: '600' },
  expires: { color: colors.textMuted, fontSize: 13 },
  inactiveCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(12, 18, 34, 0.85)',
    padding: spacing.xl,
    gap: spacing.md,
  },
  inactiveText: { color: colors.textMuted, lineHeight: 22, fontSize: 15 },
  planHint: { color: colors.textDim, fontSize: 13 },
  priceHint: { color: colors.accent, fontWeight: '700', fontSize: 18 },
  error: { color: colors.error, textAlign: 'center', fontSize: 14 },
  footer: { color: colors.textDim, textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
