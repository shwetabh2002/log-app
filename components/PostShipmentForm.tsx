import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlaceAutocomplete, PlaceValue } from './PlaceAutocomplete';
import { PhotoUploader } from './PhotoUploader';
import { ValidationHints } from './ValidationHints';
import { Button, Input } from './ui';
import { Shipment } from '../lib/api';
import { ToastTone } from '../lib/useToast';
import { colors, radius, spacing } from '../lib/theme';

/** Suggested categories — shippers can also type a custom type. */
export const ITEM_TYPE_SUGGESTIONS = [
  'Parcel',
  'Furniture',
  'Appliances',
  'Electronics',
  'Vehicles',
  'Construction',
  'Documents',
  'Other',
];

export type ShipmentFormState = {
  itemName: string;
  itemType: string;
  pickup: PlaceValue;
  drop: PlaceValue;
  price: string;
  notes: string;
  photos: string[];
  quantity: string;
  weightLbs: string;
  dimensions: string;
  fragile: boolean;
  preferredPickupDate: string;
};

export const emptyShipmentForm = (): ShipmentFormState => ({
  itemName: '',
  itemType: 'Parcel',
  pickup: { address: '' },
  drop: { address: '' },
  price: '',
  notes: '',
  photos: [],
  quantity: '1',
  weightLbs: '',
  dimensions: '',
  fragile: false,
  preferredPickupDate: '',
});

function shipmentWeightLbs(shipment: Shipment): string {
  if (shipment.weightLbs != null) return String(shipment.weightLbs);
  if (shipment.weightKg != null) return String(shipment.weightKg);
  return '';
}

export function shipmentToForm(shipment: Shipment): ShipmentFormState {
  const preferredPickupDate = shipment.preferredPickupDate
    ? shipment.preferredPickupDate.slice(0, 10)
    : '';

  return {
    itemName: shipment.itemName ?? '',
    itemType: shipment.itemType,
    pickup: {
      address: shipment.pickupLocation,
      lat: shipment.pickupLat,
      lng: shipment.pickupLng,
      placeId: shipment.pickupPlaceId,
      details: shipment.pickupLocationDetails ?? '',
    },
    drop: {
      address: shipment.dropLocation,
      lat: shipment.dropLat,
      lng: shipment.dropLng,
      placeId: shipment.dropPlaceId,
      details: shipment.dropLocationDetails ?? '',
    },
    price: String(shipment.price),
    notes: shipment.notes ?? '',
    photos: shipment.photos ?? [],
    quantity: String(shipment.quantity ?? 1),
    weightLbs: shipmentWeightLbs(shipment),
    dimensions: shipment.dimensions ?? '',
    fragile: shipment.fragile ?? false,
    preferredPickupDate,
  };
}

function hasCoords(place: PlaceValue) {
  return (
    place.address.trim().length > 0 &&
    typeof place.lat === 'number' &&
    typeof place.lng === 'number'
  );
}

export function PostShipmentForm({
  token,
  submitting,
  onSubmit,
  initial,
  mode = 'create',
  onCancel,
  onNotify,
}: {
  token: string;
  submitting: boolean;
  onSubmit: (form: ShipmentFormState) => void;
  initial?: ShipmentFormState;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  onNotify?: (message: string, tone: ToastTone) => void;
}) {
  const [form, setForm] = useState<ShipmentFormState>(() => initial ?? emptyShipmentForm());

  const pickupReady = hasCoords(form.pickup);
  const dropReady = hasCoords(form.drop);
  const itemTypeReady = Boolean(form.itemType.trim());

  const canSubmit =
    form.itemName.trim() &&
    itemTypeReady &&
    pickupReady &&
    dropReady &&
    form.price.trim();

  const validationItems = [
    { label: 'Item name entered', ok: Boolean(form.itemName.trim()) },
    { label: 'Item type / category entered', ok: itemTypeReady },
    { label: 'Pickup address selected from suggestions', ok: pickupReady },
    { label: 'Drop address selected from suggestions', ok: dropReady },
    { label: 'Price entered', ok: Boolean(form.price.trim()) },
  ];

  return (
    <View>
      <Input
        label="Item name"
        icon="📦"
        placeholder="e.g. Samsung 65-inch TV"
        value={form.itemName}
        onChangeText={(itemName) => setForm({ ...form, itemName })}
      />

      <Text style={styles.sectionLabel}>Item category</Text>
      <Text style={styles.sectionHint}>
        Pick a suggestion or type your own category for this shipment.
      </Text>
      <View style={styles.chips}>
        {ITEM_TYPE_SUGGESTIONS.map((type) => (
          <Pressable
            key={type}
            onPress={() => setForm({ ...form, itemType: type })}
            style={[styles.chip, form.itemType === type && styles.chipActive]}
          >
            <Text style={[styles.chipText, form.itemType === type && styles.chipTextActive]}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>
      <Input
        label="Custom category / item type"
        icon="🏷️"
        placeholder="e.g. Parcel, Glassware, Musical instruments..."
        value={form.itemType}
        onChangeText={(itemType) => setForm({ ...form, itemType })}
      />

      <PhotoUploader
        token={token}
        photos={form.photos}
        onChange={(photos) => setForm({ ...form, photos })}
        onNotify={onNotify}
        label="Parcel photos (for carriers to see, up to 5)"
      />

      <PlaceAutocomplete
        label="Pickup location"
        placeholder="Search pickup address"
        icon="📍"
        token={token}
        value={form.pickup}
        onChange={(pickup) => setForm({ ...form, pickup })}
        required
      />
      <Input
        label="Pickup details (optional)"
        icon="🏢"
        placeholder="Unit, floor, building, landmark, gate code..."
        value={form.pickup.details ?? ''}
        onChangeText={(details) =>
          setForm({ ...form, pickup: { ...form.pickup, details } })
        }
        multiline
      />

      <PlaceAutocomplete
        label="Drop location"
        placeholder="Search drop address"
        icon="🏁"
        token={token}
        value={form.drop}
        onChange={(drop) => setForm({ ...form, drop })}
        required
      />
      <Input
        label="Drop details (optional)"
        icon="🏢"
        placeholder="Unit, floor, building, landmark, gate code..."
        value={form.drop.details ?? ''}
        onChangeText={(details) =>
          setForm({ ...form, drop: { ...form.drop, details } })
        }
        multiline
      />

      <Input
        label="Price (USD)"
        icon="$"
        placeholder="350"
        keyboardType="numeric"
        value={form.price}
        onChangeText={(price) => setForm({ ...form, price })}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label="Quantity"
            placeholder="1"
            keyboardType="numeric"
            value={form.quantity}
            onChangeText={(quantity) => setForm({ ...form, quantity })}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="Weight (lbs)"
            placeholder="e.g. 45"
            keyboardType="numeric"
            value={form.weightLbs}
            onChangeText={(weightLbs) => setForm({ ...form, weightLbs })}
          />
        </View>
      </View>

      <Input
        label="Dimensions (L × W × H in)"
        icon="📐"
        placeholder="e.g. 48 × 32 × 24"
        value={form.dimensions}
        onChangeText={(dimensions) => setForm({ ...form, dimensions })}
      />

      <Input
        label="Preferred pickup date"
        icon="📅"
        placeholder="YYYY-MM-DD (optional)"
        value={form.preferredPickupDate}
        onChangeText={(preferredPickupDate) => setForm({ ...form, preferredPickupDate })}
      />

      <Pressable
        style={[styles.fragileRow, form.fragile && styles.fragileRowActive]}
        onPress={() => setForm({ ...form, fragile: !form.fragile })}
      >
        <Text style={styles.fragileIcon}>{form.fragile ? '☑' : '☐'}</Text>
        <View>
          <Text style={styles.fragileTitle}>Fragile item</Text>
          <Text style={styles.fragileSub}>Requires careful handling</Text>
        </View>
      </Pressable>

      <Input
        label="Notes (optional)"
        icon="📝"
        placeholder="Special instructions, access codes, etc."
        value={form.notes}
        onChangeText={(notes) => setForm({ ...form, notes })}
        multiline
      />

      <Text style={styles.coordsHint}>
        Pick an address from suggestions so pickup and drop coordinates are saved.
      </Text>

      {!canSubmit ? (
        <ValidationHints
          title={`Complete these to ${mode === 'edit' ? 'save' : 'publish'}:`}
          items={validationItems}
        />
      ) : null}

      <Button
        title={mode === 'edit' ? 'Save changes' : 'Publish shipment'}
        onPress={() => onSubmit(form)}
        loading={submitting}
        disabled={!canSubmit}
      />
      {mode === 'edit' && onCancel ? (
        <Button title="Cancel" onPress={onCancel} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13, fontWeight: '600' },
  sectionHint: { color: colors.textDim, fontSize: 12, marginBottom: spacing.sm, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  fragileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  fragileRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  fragileIcon: { fontSize: 22, color: colors.accent },
  fragileTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  fragileSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  coordsHint: { color: colors.textDim, fontSize: 12, marginBottom: spacing.lg, lineHeight: 18 },
});
