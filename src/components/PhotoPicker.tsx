import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useApp } from '@/src/state/AppContext';
import { photoSrc, pickPhoto } from '@/src/platform/photos';
import { theme } from '@/src/theme';
import { Button, ErrorText } from './ui';

export function PhotoPicker({
  label,
  photoId,
  onChange,
}: {
  label: string;
  photoId: string | null;
  onChange: (photoId: string | null) => void;
}) {
  const { data, addPhoto } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const photo = data.photos.find((item) => item.id === photoId);

  async function choose(source: 'camera' | 'library') {
    setBusy(true);
    setError(null);
    try {
      const picked = await pickPhoto(source);
      if (!picked) return;
      const result = await addPhoto(picked);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      onChange(result.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo adjuntar la imagen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {photo ? <Image source={{ uri: photoSrc(photo) }} style={styles.preview} accessibilityLabel="Comprobante adjunto" /> : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label={busy ? 'Abriendo…' : 'Cámara'} tone="secondary" icon="camera-outline" onPress={() => void choose('camera')} disabled={busy} />
        </View>
        <View style={styles.flex}>
          <Button label="Galería" tone="secondary" icon="image-outline" onPress={() => void choose('library')} disabled={busy} />
        </View>
      </View>
      {photoId ? <Button label="Quitar foto" tone="ghost" onPress={() => onChange(null)} /> : null}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: theme.text },
  preview: { width: '100%', height: 180, borderRadius: 16, backgroundColor: '#E7EFEC' },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
