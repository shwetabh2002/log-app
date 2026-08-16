import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlaceAutocomplete, PlaceValue } from '../components/PlaceAutocomplete';
import { ProfilePhotoPicker } from '../components/ProfilePhotoPicker';
import {
  Button,
  DetailTopBar,
  GlowBackground,
  Input,
  listContentStyle,
  LoadingScreen,
  Toast,
} from '../components/ui';
import { api, User } from '../lib/api';
import { roleLabel } from '../lib/roles';
import { getToken } from '../lib/storage';
import { colors, spacing } from '../lib/theme';
import { useToast } from '../lib/useToast';

export default function ProfileScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast, notify, dismiss } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>();
  const [location, setLocation] = useState<PlaceValue>({ address: '' });

  useEffect(() => {
    getToken().then(async (accessToken) => {
      if (!accessToken) {
        router.replace('/');
        return;
      }
      try {
        const me = await api.me(accessToken);
        setToken(accessToken);
        setUser(me);
        setName(me.name);
        setPhone(me.phone ?? '');
        setBio(me.bio ?? '');
        setProfilePhotoUrl(me.profilePhotoUrl);
        setLocation({
          address: me.locationLabel ?? '',
          lat: me.locationLat,
          lng: me.locationLng,
          placeId: me.locationPlaceId,
        });
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function handleSave() {
    if (!token || !user) return;
    if (!name.trim()) {
      notify('Name is required.', 'error');
      return;
    }
    if (
      location.address.trim() &&
      (location.lat == null || location.lng == null)
    ) {
      notify('Select your location from address suggestions.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let updated = await api.updateProfile(token, {
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        profilePhotoUrl: profilePhotoUrl ?? '',
      });

      if (
        location.address.trim() &&
        location.lat != null &&
        location.lng != null &&
        (
          location.address !== user.locationLabel ||
          location.lat !== user.locationLat ||
          location.lng !== user.locationLng
        )
      ) {
        updated = await api.updateLocation(token, {
          locationLabel: location.address.trim(),
          locationLat: location.lat,
          locationLng: location.lng,
          locationPlaceId: location.placeId,
        });
      }

      setUser(updated);
      notify('Profile updated successfully!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user || !token) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <GlowBackground />
      <DetailTopBar title="Profile" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[listContentStyle, styles.content]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {toast ? (
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        ) : null}

        <Text style={styles.roleLine}>{roleLabel(user.role)} · @{user.username}</Text>

        <ProfilePhotoPicker
          token={token}
          name={name || user.name}
          photoUrl={profilePhotoUrl}
          onChange={setProfilePhotoUrl}
          onNotify={notify}
        />

        <Input
          label="Full name"
          icon="👤"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Phone"
          icon="📞"
          placeholder="Add a phone number (optional)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Input
          label="Email"
          icon="✉️"
          placeholder={user.email}
          value={user.email}
          editable={false}
        />

        <Input
          label="Bio"
          icon="📝"
          placeholder="Tell others about yourself (optional)"
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <PlaceAutocomplete
          label="Base location"
          placeholder="Search your home or operating area"
          icon="📍"
          token={token}
          value={location}
          onChange={setLocation}
        />

        <Text style={styles.hint}>
          Phone and photo appear on your listings when provided. Carriers see shipper details only after expressing interest.
        </Text>

        <Button title="Save profile" onPress={handleSave} loading={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: spacing.lg },
  roleLine: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
});
