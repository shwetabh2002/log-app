import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlaceAutocomplete, PlaceValue } from '../components/PlaceAutocomplete';
import { ValidationHints } from '../components/ValidationHints';
import { Button, GlowBackground, LoadingScreen, Screen, Toast } from '../components/ui';
import { api } from '../lib/api';
import { routeAfterAuth } from '../lib/authFlow';
import {
  readCurrentPlace,
  requestAppLocationPermission,
} from '../lib/locationPermission';
import { colors, spacing } from '../lib/theme';
import { getToken } from '../lib/storage';
import { useToast } from '../lib/useToast';

const emptyPlace = (): PlaceValue => ({ address: '' });

export default function LocationSetupScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [location, setLocation] = useState<PlaceValue>(emptyPlace());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const { toast, notify, dismiss } = useToast();
  const promptedRef = useRef(false);

  const locationReady =
    location.address.trim().length > 0 &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number';

  useEffect(() => {
    getToken().then(async (accessToken) => {
      if (!accessToken) {
        router.replace('/');
        return;
      }
      setToken(accessToken);
      try {
        const me = await api.me(accessToken);
        if (me.locationLabel && me.locationLat != null && me.locationLng != null) {
          routeAfterAuth(me, router);
          return;
        }
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (loading || promptedRef.current) return;
    promptedRef.current = true;
    void promptLocationOnOpen();
  }, [loading]);

  async function promptLocationOnOpen() {
    setGpsLoading(true);
    const permission = await requestAppLocationPermission();
    if (!permission.granted) {
      notify('Location permission is needed for nearby matching. You can search manually below.', 'info');
      setGpsLoading(false);
      return;
    }
    const place = await readCurrentPlace();
    if (place) {
      setLocation(place);
      notify('Current location detected.', 'success');
    }
    setGpsLoading(false);
  }

  async function useCurrentGps() {
    setGpsLoading(true);
    const permission = await requestAppLocationPermission();
    if (!permission.granted) {
      notify('Location permission denied. Search for your city instead.', 'error');
      setGpsLoading(false);
      return;
    }
    const place = await readCurrentPlace();
    if (place) {
      setLocation(place);
      notify('Current location updated.', 'success');
    } else {
      notify('Could not read GPS. Search for your address instead.', 'error');
    }
    setGpsLoading(false);
  }

  async function saveLocation() {
    if (!token || !locationReady) {
      notify('Select your location from suggestions or use GPS.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const user = await api.updateLocation(token, {
        locationLabel: location.address.trim(),
        locationLat: location.lat!,
        locationLng: location.lng!,
        locationPlaceId: location.placeId,
      });
      notify('Location saved successfully!', 'success');
      routeAfterAuth(user, router);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save location', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !token) return <LoadingScreen />;

  return (
    <Screen scroll glow style={styles.screen}>
      <View style={styles.card}>
        {toast ? (
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        ) : null}

        <Text style={styles.title}>Set your location</Text>
        <Text style={styles.subtitle}>
          Allow location access so we can show nearby shipments and carriers sorted by distance.
        </Text>

        <PlaceAutocomplete
          label="Home / operating area"
          placeholder="Search city or address"
          token={token}
          value={location}
          onChange={setLocation}
          required
        />

        <Button
          title={gpsLoading ? 'Getting GPS...' : 'Refresh current location'}
          onPress={useCurrentGps}
          variant="secondary"
          loading={gpsLoading}
        />

        {!locationReady ? (
          <ValidationHints
            title="Complete your location to continue:"
            items={[
              { label: 'Search and pick an address from suggestions', ok: location.address.trim().length > 0 },
              {
                label: 'Address must include map coordinates (from suggestions or GPS)',
                ok: typeof location.lat === 'number' && typeof location.lng === 'number',
              },
            ]}
          />
        ) : null}

        <Button
          title="Continue"
          onPress={saveLocation}
          loading={submitting}
          disabled={!locationReady}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, lineHeight: 22, fontSize: 15 },
  error: { color: colors.error, fontSize: 14 },
});
