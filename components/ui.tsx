import { ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roleLabel } from '../lib/roles';
import { colors, layout, radius, shadow, spacing, typography } from '../lib/theme';

export function GlowBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['rgba(56,189,248,0.18)', 'transparent']}
        style={styles.glowTop}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(129,140,248,0.14)', 'transparent']}
        style={styles.glowRight}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.gridOverlay} />
    </View>
  );
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  glow = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  glow?: boolean;
}) {
  const padStyle = padded ? (scroll ? styles.screenPadScroll : styles.screenPad) : undefined;
  const content = <View style={[padStyle, style]}>{children}</View>;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {glow && <GlowBackground />}
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loading}>
      <GlowBackground />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.loadingIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.loadingMonogram}>LH</Text>
      </LinearGradient>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>Loading...</Text>
    </SafeAreaView>
  );
}

export function Avatar({
  name,
  size = 44,
  imageUrl,
}: {
  name: string;
  size?: number;
  imageUrl?: string;
}) {
  if (imageUrl?.trim()) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </LinearGradient>
  );
}

export function AppShell({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.appShell} edges={['top', 'left', 'right']}>
      <GlowBackground />
      {header}
      <View style={styles.appShellBody}>{children}</View>
      {footer}
    </SafeAreaView>
  );
}

export function TopBar({
  title,
  name,
  role,
  subscriptionActive,
  profilePhotoUrl,
  onLogout,
  onAvatarPress,
}: {
  title: string;
  name: string;
  role: string;
  subscriptionActive: boolean;
  profilePhotoUrl?: string;
  onLogout: () => void;
  onAvatarPress?: () => void;
}) {
  const firstName = name.split(' ')[0];
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarLeft}>
            <Pressable onPress={onAvatarPress} disabled={!onAvatarPress} hitSlop={8}>
              <Avatar name={name} size={40} imageUrl={profilePhotoUrl} />
            </Pressable>
            <View style={styles.topBarTitles}>
              <Text style={styles.topBarPageTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.topBarMeta} numberOfLines={1}>
                {firstName} · {roleLabel(role)}
              </Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <View style={[styles.subPill, subscriptionActive && styles.subPillActive]}>
              <View style={[styles.subDot, subscriptionActive && styles.subDotActive]} />
              <Text style={[styles.subText, subscriptionActive && styles.subTextActive]}>
                {subscriptionActive ? 'Pro' : 'Free'}
              </Text>
            </View>
            <Pressable
              onPress={() => setSignOutOpen(true)}
              hitSlop={8}
              style={styles.logoutBtn}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text style={styles.logoutIcon}>⎋</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <SignOutConfirm
        visible={signOutOpen}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          onLogout();
        }}
      />
    </>
  );
}

export function DetailTopBar({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.detailTopBar}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.detailBackBtn}>
        <Text style={styles.detailBackIcon}>‹</Text>
      </Pressable>
      <Text style={styles.detailTopTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.detailBackBtn} />
    </View>
  );
}

/** @deprecated Use TopBar inside AppShell */
export function AppHeader({
  name,
  role,
  subscriptionActive,
  onLogout,
}: {
  name: string;
  role: string;
  subscriptionActive: boolean;
  onLogout: () => void;
}) {
  return (
    <TopBar
      title="Dashboard"
      name={name}
      role={role}
      subscriptionActive={subscriptionActive}
      onLogout={onLogout}
    />
  );
}

export function BrandMark({
  size = 'lg',
  showTagline = true,
  centered = false,
}: {
  size?: 'sm' | 'lg';
  showTagline?: boolean;
  centered?: boolean;
}) {
  const isLarge = size === 'lg';
  return (
    <View style={[styles.brandWrap, centered && styles.brandWrapCenter]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.brandIcon, !isLarge && styles.brandIconSm, shadow.accent]}
      >
        <Text style={[styles.brandMonogram, !isLarge && { fontSize: 16 }]}>LH</Text>
      </LinearGradient>
      <View style={centered && styles.brandTextCenter}>
        <Text style={[styles.brandName, !isLarge && styles.brandNameSm]}>
          Logistics<Text style={styles.brandAccent}>Hub</Text>
        </Text>
        {isLarge && showTagline ? (
          <Text style={styles.brandTag}>Ship smarter. Move faster.</Text>
        ) : null}
      </View>
    </View>
  );
}

export function FeaturePills() {
  const features = ['Instant contact', 'Verified listings', 'Fixed pricing'];
  return (
    <View style={styles.featureRow}>
      {features.map((f) => (
        <View key={f} style={styles.featurePill}>
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

export function Input({
  label,
  error,
  icon,
  compact,
  secureTextEntry,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string; icon?: string; compact?: boolean }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={[styles.inputWrap, compact && styles.inputWrapCompact]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {icon ? <Text style={styles.inputIcon}>{icon}</Text> : null}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            isPassword && styles.inputWithToggle,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor={colors.textDim}
          secureTextEntry={isPassword && !passwordVisible}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            style={styles.inputToggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.inputToggleIcon}>{passwordVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder ?? 'Search listings...'}
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Text style={styles.searchClear}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
      {options.map((opt) => {
        const active = opt === selected;
        return (
          <Pressable
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function StatsRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.statsRow}>
      {items.map((item, i) => (
        <View key={item.label} style={[styles.statBox, i > 0 && styles.statBoxBorder]}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  compact,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  icon?: string;
}) {
  const inner = loading ? (
    <ActivityIndicator color={colors.white} size="small" />
  ) : (
    <View style={styles.buttonInner}>
      {icon ? <Text style={styles.buttonIcon}>{icon}</Text> : null}
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          variant === 'ghost' && styles.buttonTextGhost,
        ]}
      >
        {title}
      </Text>
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        style={({ pressed }) => [
          (disabled || loading) && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={disabled ? ['#475569', '#334155'] : [colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, compact && styles.buttonCompact, shadow.accent]}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        variant === 'success' && styles.buttonSuccess,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {inner}
    </Pressable>
  );
}

export function BottomNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; icon?: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.bottomNavIcon, isActive && styles.bottomNavIconActive]}>
                {tab.icon ?? '•'}
              </Text>
              <Text
                style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'demo';
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'accent' && styles.badgeAccent,
        tone === 'success' && styles.badgeSuccess,
        tone === 'warning' && styles.badgeWarning,
        tone === 'demo' && styles.badgeDemo,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === 'accent' && styles.badgeTextAccent,
          tone === 'success' && styles.badgeTextSuccess,
          tone === 'warning' && styles.badgeTextWarning,
          tone === 'demo' && styles.badgeTextDemo,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function GlassCard({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const inner = (
    <>
      <View style={styles.cardShine} />
      {children}
    </>
  );
  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.card}>{inner}</View>;
}

export function RouteLine({
  from,
  to,
  fromDetails,
  toDetails,
}: {
  from: string;
  to: string;
  fromDetails?: string;
  toDetails?: string;
}) {
  return (
    <View style={styles.route}>
      <View style={styles.routeTrack}>
        <View style={styles.routeDot} />
        <View style={styles.routeLine} />
        <View style={[styles.routeDot, styles.routeDotFilled]} />
      </View>
      <View style={styles.routeText}>
        <View>
          <Text style={styles.routeLabel}>PICKUP</Text>
          <Text style={styles.routeFrom}>{from}</Text>
          {fromDetails ? <Text style={styles.routeDetails}>{fromDetails}</Text> : null}
        </View>
        <View>
          <Text style={styles.routeLabel}>DROP</Text>
          <Text style={styles.routeTo}>{to}</Text>
          {toDetails ? <Text style={styles.routeDetails}>{toDetails}</Text> : null}
        </View>
      </View>
    </View>
  );
}

export function StarRating({ rating, count }: { rating: number; count?: number }) {
  const full = Math.round(rating);
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={[styles.star, i < full && styles.starFilled]}>
          ★
        </Text>
      ))}
      <Text style={styles.starValue}>{rating.toFixed(1)}</Text>
      {count != null && <Text style={styles.starCount}>({count})</Text>}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon ?? '📭'}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

export function Banner({
  message,
  tone = 'info',
  action,
}: {
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'error' | 'demo';
  action?: ReactNode;
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === 'success' && styles.bannerSuccess,
        tone === 'warning' && styles.bannerWarning,
        tone === 'error' && styles.bannerError,
        tone === 'demo' && styles.bannerDemo,
      ]}
    >
      <Text style={styles.bannerText}>{message}</Text>
      {action}
    </View>
  );
}

export function Toast({
  message,
  tone = 'info',
  onDismiss,
}: {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <View
      style={[
        styles.toast,
        tone === 'success' && styles.toastSuccess,
        tone === 'error' && styles.toastError,
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Text style={styles.toastDismiss}>✕</Text>
      </Pressable>
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ContactActions({
  phone,
  email,
  onCall,
  onWhatsApp,
  onEmail,
}: {
  phone?: string;
  email?: string;
  onCall: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
}) {
  return (
    <View style={styles.contactActions}>
      {phone ? (
        <>
          <Pressable style={styles.contactBtn} onPress={onCall}>
            <Text style={styles.contactBtnIcon}>📞</Text>
            <Text style={styles.contactBtnText}>Call</Text>
          </Pressable>
          <Pressable style={[styles.contactBtn, styles.contactBtnWa]} onPress={onWhatsApp}>
            <Text style={styles.contactBtnIcon}>💬</Text>
            <Text style={[styles.contactBtnText, styles.contactBtnTextWa]}>WhatsApp</Text>
          </Pressable>
        </>
      ) : null}
      {email ? (
        <Pressable style={styles.contactBtn} onPress={onEmail}>
          <Text style={styles.contactBtnIcon}>✉️</Text>
          <Text style={styles.contactBtnText}>Email</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ModalSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.confirmBackdrop}>
        <Pressable style={styles.confirmDismiss} onPress={onCancel} accessibilityLabel="Dismiss dialog" />
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmActions}>
            <Pressable style={styles.confirmCancelBtn} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmConfirmBtn, destructive && styles.confirmConfirmBtnDanger]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function SignOutConfirm({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      visible={visible}
      title="Sign out?"
      message="You'll need to sign in again to access your shipments and listings."
      cancelLabel="Stay signed in"
      confirmLabel="Sign out"
      destructive
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

// Legacy exports for compatibility
export const Card = GlassCard;
export function TabBar() {
  return null;
}
export function CardHeader({
  title,
  badge,
  price,
}: {
  title: string;
  badge?: string;
  price?: string;
}) {
  return (
    <View style={styles.legacyCardHeader}>
      <View style={styles.legacyCardHeaderLeft}>
        <Text style={styles.legacyCardTitle}>{title}</Text>
        {badge ? <Badge label={badge} tone="accent" /> : null}
      </View>
      {price ? <Text style={styles.legacyCardPrice}>{price}</Text> : null}
    </View>
  );
}
export function Divider() {
  return <View style={styles.divider} />;
}

export const listContentStyle = {
  paddingHorizontal: spacing.xl,
  paddingBottom: layout.tabBarInset,
  gap: spacing.md,
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -40,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowRight: {
    position: 'absolute',
    top: 80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
    borderWidth: 0,
  },
  screen: { flex: 1, backgroundColor: colors.bg },
  appShell: { flex: 1, backgroundColor: colors.bg },
  appShellBody: { flex: 1 },
  topBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 48,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  topBarTitles: { flex: 1, minWidth: 0 },
  topBarPageTitle: { color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  topBarMeta: { color: colors.textDim, fontSize: 12, marginTop: 2, fontWeight: '500' },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(12, 18, 34, 0.92)',
  },
  detailBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBackIcon: { color: colors.accent, fontSize: 28, fontWeight: '300', marginTop: -2 },
  detailTopTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  screenPad: { flex: 1, paddingHorizontal: spacing.xl },
  screenPadScroll: { width: '100%', paddingHorizontal: spacing.xl },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxxl * 3 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    gap: spacing.lg,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMonogram: { color: colors.white, fontSize: 24, fontWeight: '800' },
  loadingText: { color: colors.textMuted, ...typography.body },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarImage: {
    backgroundColor: colors.surface,
  },
  avatarText: { color: colors.white, fontWeight: '800' },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error,
  },
  subPillActive: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  subDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error },
  subDotActive: { backgroundColor: colors.success },
  subText: { color: colors.error, fontSize: 11, fontWeight: '700' },
  subTextActive: { color: colors.success },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutIcon: { color: colors.textMuted, fontSize: 18, fontWeight: '600' },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  brandWrapCenter: { flexDirection: 'column', gap: spacing.md },
  brandTextCenter: { alignItems: 'center' },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconSm: { width: 40, height: 40 },
  brandMonogram: { color: colors.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  brandName: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  brandAccent: { color: colors.accent },
  brandNameSm: { fontSize: 20 },
  brandTag: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  featurePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  featureText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  inputWrap: { marginBottom: spacing.lg },
  inputWrapCompact: { marginBottom: 0 },
  inputLabel: { color: colors.textMuted, marginBottom: spacing.sm, ...typography.label },
  inputRow: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: 15, fontSize: 16, zIndex: 1 },
  input: {
    backgroundColor: 'rgba(6, 9, 18, 0.7)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    fontSize: 16,
  },
  inputWithIcon: { paddingLeft: 44 },
  inputWithToggle: { paddingRight: 48 },
  inputToggle: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  inputToggleIcon: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  inputError: { borderColor: colors.error },
  inputErrorText: { color: colors.error, marginTop: spacing.xs, fontSize: 13 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 14 },
  searchClear: { color: colors.textDim, fontSize: 14, padding: 4 },
  chipsScroll: { marginBottom: spacing.lg, flexGrow: 0 },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.accent },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  statBox: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  statBoxBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 11, marginTop: 2, fontWeight: '600' },
  button: {
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonCompact: { paddingVertical: 10, minHeight: 42, paddingHorizontal: spacing.lg },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGhost: { backgroundColor: colors.surface, shadowOpacity: 0, elevation: 0 },
  buttonDanger: { backgroundColor: colors.errorSoft, borderWidth: 1, borderColor: colors.error, shadowOpacity: 0 },
  buttonSuccess: { backgroundColor: colors.success, shadowOpacity: 0 },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buttonIcon: { fontSize: 16 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  buttonTextSecondary: { color: colors.text },
  buttonTextGhost: { color: colors.textMuted },
  bottomNavWrap: {
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    minHeight: 52,
  },
  bottomNavItemActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  bottomNavIcon: { fontSize: 18, opacity: 0.55 },
  bottomNavIconActive: { opacity: 1 },
  bottomNavLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  bottomNavLabelActive: { color: colors.accent },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeAccent: { backgroundColor: colors.accentSoft },
  badgeSuccess: { backgroundColor: colors.successSoft },
  badgeWarning: { backgroundColor: colors.warningSoft },
  badgeDemo: { backgroundColor: colors.indigoSoft },
  badgeText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  badgeTextAccent: { color: colors.accent },
  badgeTextSuccess: { color: colors.success },
  badgeTextWarning: { color: colors.warning },
  badgeTextDemo: { color: '#60a5fa' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardShine,
  },
  cardPressed: { borderColor: colors.accent, transform: [{ scale: 0.99 }] },
  route: { flexDirection: 'row', gap: spacing.lg },
  routeTrack: { alignItems: 'center', width: 14, paddingTop: 4 },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  routeDotFilled: { backgroundColor: colors.accent },
  routeLine: { width: 2, flex: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  routeText: { flex: 1, gap: spacing.lg },
  routeLabel: { color: colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  routeFrom: { color: colors.text, fontSize: 15, fontWeight: '600' },
  routeDetails: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  routeTo: { color: colors.textMuted, fontSize: 15 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { color: colors.surfaceLight, fontSize: 18 },
  starFilled: { color: colors.warning },
  starValue: { color: colors.text, fontWeight: '700', marginLeft: spacing.sm, fontSize: 16 },
  starCount: { color: colors.textMuted, fontSize: 14, marginLeft: 4 },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: colors.textMuted, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  bannerSuccess: { backgroundColor: colors.successSoft, borderColor: colors.success },
  bannerWarning: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  bannerError: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  bannerDemo: { backgroundColor: colors.indigoSoft, borderColor: colors.accentSecondary },
  bannerText: { color: colors.text, lineHeight: 22, fontSize: 14 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  toastSuccess: { borderColor: colors.success, backgroundColor: colors.successSoft },
  toastError: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  toastText: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '500' },
  toastDismiss: { color: colors.textMuted, paddingLeft: spacing.md, fontSize: 14 },
  sectionTitle: { marginBottom: spacing.md },
  sectionTitleText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  contactActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  contactBtnWa: { backgroundColor: 'rgba(37, 211, 102, 0.12)', borderColor: '#25D366' },
  contactBtnIcon: { fontSize: 14 },
  contactBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  contactBtnTextWa: { color: '#25D366' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: { flex: 1 },
  modalSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    maxHeight: '78%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.lg },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  confirmDismiss: { ...StyleSheet.absoluteFill },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    zIndex: 2,
    elevation: 8,
  },
  confirmTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  confirmMessage: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  confirmCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmCancelText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  confirmConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  confirmConfirmBtnDanger: { backgroundColor: colors.error, borderColor: colors.error },
  confirmConfirmText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  legacyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  legacyCardHeaderLeft: { flex: 1, gap: spacing.sm },
  legacyCardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  legacyCardPrice: { color: colors.accent, fontSize: 18, fontWeight: '800' },
});
