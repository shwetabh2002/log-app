import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, PlaceDetails, PlaceSuggestion } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';

export type PlaceValue = {
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  /** Unit, floor, building, landmark, access notes, etc. */
  details?: string;
};

export function PlaceAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  token,
  icon = '📍',
  required = false,
}: {
  label: string;
  placeholder: string;
  value: PlaceValue;
  onChange: (next: PlaceValue) => void;
  token: string;
  icon?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionToken = useRef(`${Date.now()}-${Math.random()}`);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  function scheduleSearch(text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const results = await api.placesAutocomplete(token, text, sessionToken.current);
        setSuggestions(results);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  async function selectSuggestion(item: PlaceSuggestion) {
    setQuery(item.description);
    setOpen(false);
    setSuggestions([]);
    try {
      const details: PlaceDetails = await api.placeDetails(
        token,
        item.placeId,
        sessionToken.current,
      );
      sessionToken.current = `${Date.now()}-${Math.random()}`;
      onChange({
        address: details.address,
        lat: details.lat,
        lng: details.lng,
        placeId: details.placeId,
        details: value.details,
      });
    } catch {
      onChange({ address: item.description, placeId: item.placeId, details: value.details });
    }
  }

  const hasCoords = typeof value.lat === 'number' && typeof value.lng === 'number';
  const needsSelection = required && value.address.trim() && !hasCoords;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hasCoords ? <Text style={styles.pinnedBadge}>📌 Located</Text> : null}
      </View>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          style={[styles.input, needsSelection && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            onChange({
              address: text,
              lat: undefined,
              lng: undefined,
              placeId: undefined,
              details: value.details,
            });
            scheduleSearch(text);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {loading ? <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} /> : null}
      </View>
      {open && suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          {suggestions.map((item) => (
            <Pressable
              key={item.placeId}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => selectSuggestion(item)}
            >
              <Text style={styles.optionMain}>{item.mainText}</Text>
              {item.secondaryText ? (
                <Text style={styles.optionSub}>{item.secondaryText}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      {needsSelection ? (
        <Text style={styles.errorText}>Select an address from the list to save coordinates.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  pinnedBadge: { color: colors.success, fontSize: 11, fontWeight: '700' },
  row: { position: 'relative' },
  icon: { position: 'absolute', left: 14, top: 15, fontSize: 16, zIndex: 1 },
  input: {
    backgroundColor: 'rgba(6, 9, 18, 0.7)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingLeft: 44,
    paddingVertical: 15,
    fontSize: 16,
  },
  inputError: { borderColor: colors.error },
  spinner: { position: 'absolute', right: 14, top: 14 },
  dropdown: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  option: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionPressed: { backgroundColor: colors.accentSoft },
  optionMain: { color: colors.text, fontSize: 15, fontWeight: '600' },
  optionSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  errorText: { color: colors.error, fontSize: 12, marginTop: spacing.xs },
});
