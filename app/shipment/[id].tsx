import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ValidationMessage } from '../../components/ValidationHints';
import {
  Badge,
  Button,
  DetailTopBar,
  GlassCard,
  GlowBackground,
  listContentStyle,
  LoadingScreen,
  RouteLine,
  SectionTitle,
  StarRating,
  Toast,
} from '../../components/ui';
import { api, Shipment, User } from '../../lib/api';
import { formatCurrency, formatDistanceMiles, formatLocationDetails, formatStatus, itemIcon } from '../../lib/format';
import { shipmentTitle } from '../../lib/roles';
import { colors, radius, spacing } from '../../lib/theme';
import { getToken } from '../../lib/storage';
import { useToast } from '../../lib/useToast';

function statusTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'open') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'neutral';
}

export default function ShipmentDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [rating, setRating] = useState<{ averageRating: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [alreadyInterested, setAlreadyInterested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast, notify, dismiss } = useToast();

  useEffect(() => {
    if (!id) return;
    getToken().then(async (accessToken) => {
      setToken(accessToken);
      try {
        const data = await api.getShipment(id);
        setShipment(data);
        if (data.shipperId?._id) {
          const summary = await api.getUserReviewSummary(data.shipperId._id);
          setRating(summary);
        }
        if (accessToken) {
          const me = await api.me(accessToken);
          setUser(me);
          if (me.role === 'carrier') {
            const interests = await api.getMyInterests(accessToken);
            const interested = interests.some(
              (item) => item.listingType === 'shipment' && String(item.listingId) === id,
            );
            setAlreadyInterested(interested);
          }
        }
      } finally {
        setLoading(false);
      }
    });
  }, [id]);

  async function handleInterested() {
    if (!token || !id || alreadyInterested) return;
    if (!user?.subscriptionActive) {
      notify('Active subscription required to express interest.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.expressInterest(token, { listingType: 'shipment', listingId: id });
      setAlreadyInterested(true);
      notify('Interest sent successfully!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to express interest', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !shipment) return <LoadingScreen />;

  const isCarrier = user?.role === 'carrier';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <GlowBackground />
      <DetailTopBar title={shipmentTitle(shipment)} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[listContentStyle, styles.detailContent]}
        showsVerticalScrollIndicator={false}
      >
        {toast ? (
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>{itemIcon(shipment.itemType)}</Text>
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.heroBadges}>
              <Badge label={formatStatus(shipment.status)} tone={statusTone(shipment.status)} />
              <Badge label={shipment.itemType} tone="accent" />
              {shipment.fragile ? <Badge label="Fragile" tone="warning" /> : null}
            </View>
            <Text style={styles.price}>{formatCurrency(shipment.price)}</Text>
            {shipment.distanceKm != null && (
              <Text style={styles.distance}>{formatDistanceMiles(shipment.distanceKm)} away</Text>
            )}
          </View>
        </View>

        {shipment.photos && shipment.photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {shipment.photos.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.photo} />
            ))}
          </ScrollView>
        ) : null}

        <GlassCard>
          <SectionTitle title="Details" />
          {shipment.quantity != null && shipment.quantity > 1 ? (
            <Text style={styles.metaLine}>Quantity: {shipment.quantity}</Text>
          ) : null}
          {shipment.weightLbs != null || shipment.weightKg != null ? (
            <Text style={styles.metaLine}>
              Weight: {shipment.weightLbs ?? shipment.weightKg} lbs
            </Text>
          ) : null}
          {shipment.dimensions ? (
            <Text style={styles.metaLine}>Dimensions: {shipment.dimensions} in</Text>
          ) : null}
          {shipment.preferredPickupDate ? (
            <Text style={styles.metaLine}>
              Preferred pickup: {new Date(shipment.preferredPickupDate).toLocaleDateString()}
            </Text>
          ) : null}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Route" />
          <RouteLine
            from={shipment.pickupLocation}
            to={shipment.dropLocation}
            fromDetails={formatLocationDetails(shipment.pickupLocationDetails)}
            toDetails={formatLocationDetails(shipment.dropLocationDetails)}
          />
        </GlassCard>

        {shipment.notes ? (
          <GlassCard>
            <SectionTitle title="Notes" />
            <Text style={styles.notes}>{shipment.notes}</Text>
          </GlassCard>
        ) : null}

        {rating && rating.count > 0 && (
          <GlassCard>
            <SectionTitle title="Shipper rating" />
            <StarRating rating={rating.averageRating} count={rating.count} />
          </GlassCard>
        )}

        {token && isCarrier && (
          <>
            {!user.subscriptionActive ? (
              <ValidationMessage
                tone="info"
                message="Activate your subscription in Settings to express interest on this shipment."
              />
            ) : alreadyInterested ? (
              <ValidationMessage
                tone="success"
                message="Interest already sent. The shipper can view your profile and contact you. Wait for them to assign the shipment."
              />
            ) : null}
            <Button
              title={
                alreadyInterested
                  ? 'Interest already sent'
                  : user.subscriptionActive
                    ? 'Express interest'
                    : 'Subscription required'
              }
              onPress={handleInterested}
              loading={submitting}
              disabled={alreadyInterested || !user.subscriptionActive}
              variant={alreadyInterested ? 'secondary' : 'primary'}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  detailContent: { paddingTop: spacing.lg },
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 28 },
  heroMeta: { flex: 1, gap: spacing.xs },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  photoRow: { marginBottom: spacing.lg },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  metaLine: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.xs },
  price: { color: colors.accent, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  distance: { color: colors.textMuted, fontSize: 13 },
  notes: { color: colors.textMuted, lineHeight: 22, fontSize: 15 },
});
