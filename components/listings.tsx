import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CarrierListing, Shipment } from '../lib/api';
import { formatCurrency, formatDistanceMiles, formatLocationDetails, formatStatus, getShipmentContact, itemIcon } from '../lib/format';
import { shipmentTitle } from '../lib/roles';
import { colors, radius, spacing } from '../lib/theme';
import { ValidationHints, ValidationMessage } from './ValidationHints';
import { Badge, Button, GlassCard, RouteLine } from './ui';

export function ShipmentListingCard({
  shipment,
  subscriptionActive,
  onView,
  onInterested,
  showInterested,
  showShipperContact = false,
  alreadyInterested = false,
}: {
  shipment: Shipment;
  subscriptionActive: boolean;
  onView: () => void;
  onInterested: () => void;
  showInterested: boolean;
  showShipperContact?: boolean;
  alreadyInterested?: boolean;
}) {
  const contact = showShipperContact ? getShipmentContact(shipment) : null;

  return (
    <GlassCard onPress={onView}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>{itemIcon(shipment.itemType)}</Text>
        </View>
        <View style={styles.topContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={1}>{shipmentTitle(shipment)}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{shipment.itemType}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(shipment.price)}</Text>
          </View>
          <View style={styles.badges}>
            <Badge label={formatStatus(shipment.status)} tone={shipment.status === 'open' ? 'success' : 'warning'} />
            {shipment.distanceKm != null && (
              <Badge label={formatDistanceMiles(shipment.distanceKm)} tone="accent" />
            )}
          </View>
        </View>
      </View>

      <RouteLine
        from={shipment.pickupLocation}
        to={shipment.dropLocation}
        fromDetails={formatLocationDetails(shipment.pickupLocationDetails)}
        toDetails={formatLocationDetails(shipment.dropLocationDetails)}
      />

      {shipment.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{shipment.notes}</Text>
      ) : null}

      {contact && (contact.phone?.trim() || contact.email?.trim()) ? (
        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.phone?.trim() ? (
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            ) : null}
            {contact.email?.trim() ? (
              <Text style={styles.contactPhone}>{contact.email}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {showInterested ? (
        <>
          {!subscriptionActive ? (
            <ValidationMessage
              tone="info"
              message="Activate your plan in Settings to express interest on shipments."
            />
          ) : alreadyInterested ? (
            <ValidationMessage
              tone="success"
              message="Interest already sent. The shipper can view your profile and contact you. You cannot send interest again for this shipment."
            />
          ) : null}
        </>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <Button title="Details" onPress={onView} variant="secondary" compact />
        </View>
        {showInterested && subscriptionActive && !alreadyInterested ? (
          <View style={styles.actionBtn}>
            <Button title="Interested" onPress={onInterested} compact />
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

export function CarrierListingCard({
  listing,
  subscriptionActive,
  onInterested,
  showInterested,
}: {
  listing: CarrierListing;
  subscriptionActive: boolean;
  onInterested: () => void;
  showInterested: boolean;
}) {
  return (
    <GlassCard>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, styles.iconBoxCarrier]}>
          <Text style={styles.iconEmoji}>{itemIcon(listing.vehicleType)}</Text>
        </View>
        <View style={styles.topContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{listing.vehicleType}</Text>
            <Text style={styles.price}>{formatCurrency(listing.price)}</Text>
          </View>
          <View style={styles.badges}>
            <Badge label={listing.availability} tone="success" />
            {listing.distanceKm != null && (
              <Badge label={formatDistanceMiles(listing.distanceKm)} tone="accent" />
            )}
          </View>
          <Text style={styles.area}>📍 {listing.serviceArea}</Text>
        </View>
      </View>

      {listing.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{listing.notes}</Text>
      ) : null}

      <View style={styles.contactRow}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitial}>{listing.carrierId.name.charAt(0)}</Text>
        </View>
        <View style={styles.contactMeta}>
          <Text style={styles.contactName}>{listing.carrierId.name}</Text>
          {listing.carrierId.phone?.trim() ? (
            <Text style={styles.contactPhone}>{listing.carrierId.phone}</Text>
          ) : null}
        </View>
      </View>

      {showInterested && subscriptionActive && (
        <Button title="Express interest" onPress={onInterested} compact icon="✦" />
      )}
    </GlassCard>
  );
}

export function MyShipmentCard({
  shipment,
  onStatusChange,
  onViewInterests,
  onEdit,
  onViewAssignedCarrier,
}: {
  shipment: Shipment;
  onStatusChange: (status: 'open' | 'in_progress' | 'closed') => void;
  onViewInterests: () => void;
  onEdit?: () => void;
  onViewAssignedCarrier?: (carrierId: string) => void;
}) {
  const canEdit = shipment.status !== 'closed';
  const coverPhoto = shipment.photos?.[0];

  return (
    <GlassCard>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <Text style={styles.iconEmoji}>{itemIcon(shipment.itemType)}</Text>
          )}
        </View>
        <View style={styles.topContent}>
          <Text style={styles.title}>{shipmentTitle(shipment)}</Text>
          <Text style={styles.subtitle}>{shipment.itemType}</Text>
          <Text style={styles.price}>{formatCurrency(shipment.price)}</Text>
        </View>
      </View>

      {shipment.photos && shipment.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {shipment.photos.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}

      <RouteLine
        from={shipment.pickupLocation}
        to={shipment.dropLocation}
        fromDetails={formatLocationDetails(shipment.pickupLocationDetails)}
        toDetails={formatLocationDetails(shipment.dropLocationDetails)}
      />

      {shipment.assignedCarrierId ? (
        <View style={styles.assignedBlock}>
          <Badge label="Carrier assigned" tone="success" />
          <Text style={styles.assignedName}>{shipment.assignedCarrierId.name}</Text>
          {onViewAssignedCarrier ? (
            <Button
              title="View assigned carrier"
              onPress={() => onViewAssignedCarrier(shipment.assignedCarrierId!._id)}
              variant="ghost"
              compact
            />
          ) : null}
        </View>
      ) : (
        <ValidationMessage
          tone="info"
          message="No carrier assigned yet. Tap View interested carriers, review profiles, contact carriers, then assign manually when you are satisfied."
        />
      )}

      <Text style={styles.statusLabel}>Status</Text>
      <View style={styles.statusRow}>
        {(['open', 'in_progress', 'closed'] as const).map((status) => (
          <Pressable
            key={status}
            style={[styles.statusChip, shipment.status === status && styles.statusChipActive]}
            onPress={() => onStatusChange(status)}
          >
            <Text style={[styles.statusChipText, shipment.status === status && styles.statusChipTextActive]}>
              {formatStatus(status)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.actions}>
        {canEdit && onEdit ? (
          <View style={styles.actionBtn}>
            <Button title="Edit" onPress={onEdit} compact />
          </View>
        ) : null}
        <View style={styles.actionBtn}>
          <Button title="View interested carriers" onPress={onViewInterests} variant="secondary" compact />
        </View>
      </View>
    </GlassCard>
  );
}

export function MyCarrierCard({
  listing,
  onViewInterests,
}: {
  listing: CarrierListing;
  onViewInterests: () => void;
}) {
  return (
    <GlassCard>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, styles.iconBoxCarrier]}>
          <Text style={styles.iconEmoji}>{itemIcon(listing.vehicleType)}</Text>
        </View>
        <View style={styles.topContent}>
          <Text style={styles.title}>{listing.vehicleType}</Text>
          <Text style={styles.price}>{formatCurrency(listing.price)}</Text>
          <Text style={styles.area}>📍 {listing.serviceArea}</Text>
        </View>
      </View>
      <Button title="View interested shippers" onPress={onViewInterests} variant="secondary" compact />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxCarrier: { backgroundColor: colors.indigoSoft },
  iconEmoji: { fontSize: 24 },
  coverPhoto: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surface },
  photoRow: { marginBottom: spacing.md },
  photo: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  topContent: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  titleBlock: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  price: { color: colors.accent, fontSize: 17, fontWeight: '800' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  area: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  notes: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm, fontStyle: 'italic' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  contactMeta: { flex: 1 },
  contactName: { color: colors.text, fontWeight: '600', fontSize: 14 },
  contactPhone: { color: colors.textDim, fontSize: 13 },
  ratingMini: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingMiniStar: { color: colors.warning, fontSize: 14 },
  ratingMiniVal: { color: colors.text, fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  assignedBlock: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    backgroundColor: colors.successSoft,
    gap: spacing.xs,
  },
  assignedName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  statusLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  statusChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  statusChipTextActive: { color: colors.accent },
});
