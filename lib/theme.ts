/** LogisticsHub design tokens — shared with web palette */
export const colors = {
  bg: '#060912',
  bgElevated: '#0C1222',
  surface: '#131B2E',
  surfaceLight: '#1A2438',
  border: 'rgba(148, 163, 184, 0.12)',
  borderLight: 'rgba(148, 163, 184, 0.2)',
  borderFocus: 'rgba(56, 189, 248, 0.5)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  accent: '#38BDF8',
  accentSecondary: '#818CF8',
  accentDark: '#0EA5E9',
  accentSoft: 'rgba(56, 189, 248, 0.12)',
  accentGlow: 'rgba(56, 189, 248, 0.22)',
  indigoSoft: 'rgba(129, 140, 248, 0.14)',
  warm: '#FBBF24',
  warmSoft: 'rgba(251, 191, 36, 0.14)',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.12)',
  error: '#F87171',
  errorSoft: 'rgba(248, 113, 113, 0.12)',
  white: '#FFFFFF',
  cardShine: 'rgba(255, 255, 255, 0.06)',
  gradientStart: '#38BDF8',
  gradientEnd: '#818CF8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const typography = {
  hero: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1.2 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1 },
};

export const layout = {
  listBottomInset: 32,
  tabBarInset: 88,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  accent: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
