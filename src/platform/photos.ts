import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PickedPhoto {
  mime: string;
  dataBase64: string;
}

export function photoSrc(photo: { mime: string; dataBase64: string }): string {
  return `data:${photo.mime};base64,${photo.dataBase64}`;
}

async function shrink(uri: string, fallback?: string | null, mime?: string | null): Promise<PickedPhoto | null> {
  try {
    const rendered = await ImageManipulator.manipulate(uri).resize({ width: 1200 }).renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.62, format: SaveFormat.JPEG, base64: true });
    if (saved.base64) return { mime: 'image/jpeg', dataBase64: saved.base64 };
  } catch {
    // Si el recorte falla, guardamos la imagen original.
  }
  if (fallback) return { mime: mime || 'image/jpeg', dataBase64: fallback };
  return null;
}

export async function pickPhoto(source: 'camera' | 'library'): Promise<PickedPhoto | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Necesitamos permiso para usar la cámara. En el navegador puedes elegir una imagen de tu equipo.');
    }
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Necesitamos permiso para ver tus fotos.');
    }
  }

  const options = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.6, base64: true };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return shrink(asset.uri, asset.base64, asset.mimeType);
}
