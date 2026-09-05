/**
 * Dev-only UI (test logins).
 * Release APK sets NODE_ENV=production → chips + passwords stripped from bundle.
 * Override: EXPO_PUBLIC_ENABLE_DEV_TOOLS=true|false
 */
export function isDevToolsEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'true') return true;
  if (process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/** null in production builds unless explicitly forced via ENABLE_DEV_TOOLS. */
export const DEV_TEST_ACCOUNTS =
  process.env.NODE_ENV !== 'production' ||
  process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'true'
    ? ({
        carrier: { login: 'testcarrier', password: 'test1234' },
        shipper: { login: 'testshipper', password: 'test1234' },
      } as const)
    : null;
