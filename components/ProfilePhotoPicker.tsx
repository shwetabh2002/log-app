import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../lib/api';
import { ToastTone } from '../lib/useToast';
import { colors, radius, spacing } from '../lib/theme';
import { Avatar, Button } from './ui';

async function resolveUploadUri(uri: string, fileName: string): Promise<string> {
  if (uri.startsWith('file://')) return uri;
  const dest = `${FileSystem.cacheDirectory ?? ''}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

async function putLocalFile(
  localUri: string,
  uploadUrl: string,
  mimeType: string,
  fileName: string,
) {
  const fileUri = await resolveUploadUri(localUri, fileName);
  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': mimeType },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error('Upload failed');
  }
}

export function ProfilePhotoPicker({
  token,
  name,
  photoUrl,
  onChange,
  onNotify,
}: {
  token: string;
  name: string;
  photoUrl?: string;
  onChange: (url: string | undefined) => void;
  onNotify?: (message: string, tone: ToastTone) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function pickPhoto() {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      const msg = 'Photo library permission is required.';
      setError(msg);
      onNotify?.(msg, 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const fileName = asset.fileName ?? `profile-${Date.now()}.jpg`;
      const presign = await api.presignUpload(token, mimeType, fileName);
      await putLocalFile(asset.uri, presign.uploadUrl, mimeType, fileName);
      onChange(presign.publicUrl);
      onNotify?.('Photo uploaded. Tap Save profile to keep it.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={pickPhoto} style={styles.photoWrap}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <Avatar name={name} size={96} />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{uploading ? '…' : '📷'}</Text>
        </View>
      </Pressable>
      <Button
        title={uploading ? 'Uploading...' : photoUrl ? 'Change photo' : 'Add photo'}
        onPress={pickPhoto}
        loading={uploading}
        variant="secondary"
        compact
      />
      {photoUrl ? (
        <Button title="Remove photo" onPress={() => {
          onChange(undefined);
          onNotify?.('Photo removed. Tap Save profile to apply.', 'info');
        }} variant="ghost" compact />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  photoWrap: { position: 'relative' },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: { fontSize: 14 },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
});
