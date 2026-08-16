import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { api } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { ToastTone } from '../lib/useToast';

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
    throw new Error('Upload to S3 failed');
  }
}

export function PhotoUploader({
  token,
  photos,
  onChange,
  maxPhotos = 5,
  onNotify,
  label,
}: {
  token: string;
  photos: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
  onNotify?: (message: string, tone: ToastTone) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function pickPhotos() {
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
      allowsMultipleSelection: true,
      selectionLimit: maxPhotos - photos.length,
      quality: 0.85,
    });

    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        const mimeType = asset.mimeType ?? 'image/jpeg';
        const fileName = asset.fileName ?? `photo-${Date.now()}.jpg`;
        const presign = await api.presignUpload(token, mimeType, fileName);
        await putLocalFile(asset.uri, presign.uploadUrl, mimeType, fileName);
        uploaded.push(presign.publicUrl);
      }
      onChange([...photos, ...uploaded].slice(0, maxPhotos));
      const count = uploaded.length;
      onNotify?.(
        count === 1 ? 'Photo uploaded successfully.' : `${count} photos uploaded successfully.`,
        'success',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    onChange(photos.filter((p) => p !== url));
    onNotify?.('Photo removed.', 'info');
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label ?? `Parcel photos (for carriers to see, up to ${maxPhotos})`}
      </Text>
      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {photos.map((url, index) => (
            <View key={`${index}-${url}`} style={styles.thumbWrap}>
              <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
              <Pressable style={styles.removeBtn} onPress={() => removePhoto(url)}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
      {photos.length < maxPhotos ? (
        <Button
          title={uploading ? 'Uploading...' : 'Add photos'}
          onPress={pickPhotos}
          loading={uploading}
          variant="secondary"
          compact
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { color: colors.textMuted, marginBottom: spacing.sm, fontSize: 13, fontWeight: '600' },
  thumbRow: { marginBottom: spacing.md },
  thumbWrap: { marginRight: spacing.sm, position: 'relative' },
  thumb: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surface },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  error: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
});
