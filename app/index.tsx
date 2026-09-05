import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ValidationHints } from '../components/ValidationHints';
import {
  BrandMark,
  Button,
  Input,
  LoadingScreen,
  Screen,
  Toast,
} from '../components/ui';
import { api } from '../lib/api';
import { routeAfterAuth } from '../lib/authFlow';
import { DEV_TEST_ACCOUNTS, isDevToolsEnabled } from '../lib/env';
import { colors, radius, spacing } from '../lib/theme';
import { clearToken, getToken, saveToken } from '../lib/storage';
import { useToast } from '../lib/useToast';

const SHOW_DEV_LOGIN = isDevToolsEnabled() && DEV_TEST_ACCOUNTS !== null;

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export default function LoginScreen() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast, notify, dismiss } = useToast();

  useEffect(() => {
    getToken().then(async (token) => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const user = await api.me(token);
        routeAfterAuth(user, router);
      } catch {
        await clearToken();
        setLoading(false);
      }
    });
  }, [router]);

  async function completeLogin(accessToken: string, user: Awaited<ReturnType<typeof api.login>>['user']) {
    await saveToken(accessToken);
    routeAfterAuth(user, router);
  }

  async function loginWithCredentials(credentials: { login: string; password: string }) {
    setSubmitting(true);
    try {
      const { accessToken, user } = await api.login({
        login: credentials.login.trim(),
        password: credentials.password,
      });
      notify('Signed in successfully!', 'success');
      await completeLogin(accessToken, user);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <Screen scroll glow style={styles.screen}>
      <View style={styles.hero}>
        <BrandMark showTagline={false} centered />
      </View>

      <View style={styles.formCard}>
        {toast ? (
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        ) : null}

        <LinearGradient
          colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']}
          style={styles.formShine}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.formTitle}>Sign in</Text>
        <Text style={styles.formSub}>
          Use your email or username and the password shown after web registration
        </Text>

        <View style={styles.fields}>
          <Input
            compact
            placeholder="Email or username"
            autoCapitalize="none"
            autoComplete="username"
            value={login}
            onChangeText={setLogin}
          />
          <Input
            compact
            placeholder="Password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {(!login.trim() || !password) ? (
          <ValidationHints
            compact
            tone="info"
            title="Enter credentials to sign in:"
            items={[
              { label: 'Email or username', ok: Boolean(login.trim()) },
              { label: 'Password', ok: Boolean(password) },
            ]}
          />
        ) : null}

        <Button
          title="Sign in"
          onPress={() => loginWithCredentials({ login, password })}
          loading={submitting}
          disabled={!login.trim() || !password}
        />
      </View>

      {SHOW_DEV_LOGIN && DEV_TEST_ACCOUNTS ? (
        <View style={styles.devRow}>
          <Text style={styles.devHint}>Dev</Text>
          <Pressable
            onPress={() => loginWithCredentials(DEV_TEST_ACCOUNTS.carrier)}
            disabled={submitting}
            style={({ pressed }) => [styles.devChip, pressed && styles.devChipPressed]}
          >
            <Text style={styles.devChipText}>Carrier</Text>
          </Pressable>
          <Pressable
            onPress={() => loginWithCredentials(DEV_TEST_ACCOUNTS.shipper)}
            disabled={submitting}
            style={({ pressed }) => [styles.devChip, pressed && styles.devChipPressed]}
          >
            <Text style={styles.devChipText}>Shipper</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.registerHint}>
        No account? Request access at {WEB_URL.replace(/^https?:\/\//, '')}/join
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: 'rgba(12, 18, 34, 0.72)',
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 14,
  },
  formShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  formTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  formSub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  fields: { gap: spacing.md },
  error: {
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 13,
    textAlign: 'center',
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  devHint: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  devChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  devChipPressed: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  devChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  registerHint: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
