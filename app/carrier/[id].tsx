import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ValidationHints, ValidationMessage } from '../../components/ValidationHints';
import {
  Avatar,
  Badge,
  Button,
  ContactActions,
  DetailTopBar,
  GlassCard,
  GlowBackground,
  listContentStyle,
  LoadingScreen,
  SectionTitle,
  StarRating,
  Toast,
} from '../../components/ui';
import { api, CarrierProfile, User } from '../../lib/api';
import { getToken } from '../../lib/storage';
import { colors, radius, spacing } from '../../lib/theme';
import { useToast } from '../../lib/useToast';

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CarrierProfileScreen() {
  const { id: rawId, shipmentId: rawShipmentId } = useLocalSearchParams<{
    id: string | string[];
    shipmentId?: string | string[];
  }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const shipmentId = Array.isArray(rawShipmentId) ? rawShipmentId[0] : rawShipmentId;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [viewer, setViewer] = useState<User | null>(null);
  const [profile, setProfile] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [shipmentAssignedCarrierId, setShipmentAssignedCarrierId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const { toast, notify, dismiss } = useToast();

  useEffect(() => {
    if (!id) return;
    getToken().then(async (accessToken) => {
      if (!accessToken) {
        router.replace('/');
        return;
      }
      setToken(accessToken);
      try {
        const [me, data] = await Promise.all([
          api.me(accessToken),
          api.getCarrierProfile(accessToken, id),
        ]);
        setViewer(me);
        setProfile(data);
        if (shipmentId) {
          const shipment = await api.getShipment(shipmentId);
          const assigned = shipment.assignedCarrierId;
          setShipmentAssignedCarrierId(
            assigned && typeof assigned === 'object' ? assigned._id : null,
          );
        }
      } catch {
        setLoadError(true);
        notify('Could not load carrier profile.', 'error');
      } finally {
        setLoading(false);
      }
    });
  }, [id, shipmentId, router]);

  async function handleAssign() {
    if (!token || !shipmentId || !id) return;
    setAssigning(true);
    try {
      await api.assignCarrierToShipment(token, shipmentId, id);
      notify('Carrier assigned successfully!', 'success');
      setTimeout(() => router.back(), 800);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to assign carrier', 'error');
    } finally {
      setAssigning(false);
    }
  }

  function handleCall() {
    const phone = profile?.user.phone?.trim();
    if (phone) Linking.openURL(`tel:${phone}`);
  }

  function handleWhatsApp() {
    const digits = profile?.user.phone?.replace(/\D/g, '') ?? '';
    if (digits) Linking.openURL(`https://wa.me/${digits}`);
  }

  function handleEmail() {
    const email = profile?.user.email?.trim();
    if (email) Linking.openURL(`mailto:${email}`);
  }

  if (loading) return <LoadingScreen />;

  if (loadError || !profile) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <GlowBackground />
        <DetailTopBar title="Carrier profile" onBack={() => router.back()} />
        <View style={styles.errorWrap}>
          {toast ? (
            <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
          ) : null}
          <Text style={styles.errorText}>Could not load carrier profile.</Text>
          <Button title="Go back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats, reviewSummary, recentReviews } = profile;
  const isShipper = viewer?.role === 'shipper';
  const alreadyAssignedToThis = shipmentAssignedCarrierId === id;
  const assignedToOther =
    Boolean(shipmentAssignedCarrierId) && shipmentAssignedCarrierId !== id;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <GlowBackground />
      <DetailTopBar title="Carrier profile" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[listContentStyle, styles.content]}
        showsVerticalScrollIndicator={false}
      >
        {toast ? (
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        ) : null}

        <View style={styles.hero}>
          <Avatar name={user.name} size={88} imageUrl={user.profilePhotoUrl} />
          <Text style={styles.name}>{user.name}</Text>
          {user.locationLabel ? (
            <Text style={styles.location}>{user.locationLabel}</Text>
          ) : null}
          {reviewSummary.count > 0 ? (
            <StarRating rating={reviewSummary.averageRating} count={reviewSummary.count} />
          ) : (
            <Text style={styles.noReviews}>No reviews yet</Text>
          )}
        </View>

        <GlassCard>
          <SectionTitle title="Delivery history" />
          <View style={styles.statsGrid}>
            <StatBox label="Completed" value={stats.completedDeliveries} />
            <StatBox label="In progress" value={stats.inProgressDeliveries} />
            <StatBox label="Interests sent" value={stats.totalInterests} />
            <StatBox label="Vehicle listings" value={stats.vehicleListings} />
          </View>
        </GlassCard>

        {user.bio ? (
          <GlassCard>
            <SectionTitle title="About" />
            <Text style={styles.bio}>{user.bio}</Text>
          </GlassCard>
        ) : null}

        <GlassCard>
          <SectionTitle title="Contact" />
          {user.phone?.trim() ? (
            <Text style={styles.contactLine}>📞 {user.phone}</Text>
          ) : null}
          <Text style={styles.contactLine}>✉️ {user.email}</Text>
          <ContactActions
            phone={user.phone?.trim()}
            email={user.email?.trim()}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
            onEmail={handleEmail}
          />
        </GlassCard>

        {recentReviews.length > 0 ? (
          <GlassCard>
            <SectionTitle title="Recent reviews" />
            {recentReviews.map((review) => (
              <View key={review._id} style={styles.reviewRow}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewer}>{review.reviewerId.name}</Text>
                  <Badge label={`${review.rating}/5`} tone="accent" />
                </View>
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}
              </View>
            ))}
          </GlassCard>
        ) : null}

        {isShipper ? (
          <GlassCard>
            <SectionTitle title="Assign to shipment" />
            {alreadyAssignedToThis ? (
              <ValidationMessage
                tone="success"
                message="This carrier is already assigned to your shipment."
              />
            ) : assignedToOther ? (
              <ValidationMessage
                tone="warning"
                message="Another carrier is already assigned to this shipment. You cannot assign a different carrier unless you change the assignment first."
              />
            ) : !shipmentId ? (
              <ValidationHints
                tone="info"
                title="To assign this carrier:"
                items={[
                  { label: 'Open a shipment from My Posts', ok: false },
                  { label: 'Tap View interested carriers', ok: false },
                  { label: 'Open this carrier profile from that list', ok: false },
                  { label: 'Review history, contact them, then assign manually', ok: false },
                ]}
              />
            ) : (
              <>
                <ValidationMessage
                  tone="info"
                  message="Review delivery history and contact the carrier first. Assignment is manual — only you decide when to assign."
                />
                <Button
                  title="Assign this carrier to shipment"
                  onPress={handleAssign}
                  loading={assigning}
                />
              </>
            )}
          </GlassCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  name: { color: colors.text, fontSize: 24, fontWeight: '800' },
  location: { color: colors.textMuted, fontSize: 14 },
  noReviews: { color: colors.textDim, fontSize: 13 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { color: colors.accent, fontSize: 28, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: spacing.xs },
  bio: { color: colors.textMuted, lineHeight: 22, fontSize: 15 },
  contactLine: { color: colors.text, fontSize: 15, marginBottom: spacing.sm },
  reviewRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewer: { color: colors.text, fontWeight: '700', fontSize: 15 },
  reviewComment: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  errorText: { color: colors.textMuted, textAlign: 'center', fontSize: 15 },
});
