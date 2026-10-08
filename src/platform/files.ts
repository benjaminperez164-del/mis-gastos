import { Platform } from 'react-native';

export async function writeTextFile(filename: string, contents: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const FileSystem = await import('expo-file-system');
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'respaldos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const file = new FileSystem.File(dir, filename);
  if (!file.exists) file.create();
  file.write(contents);
  return file.uri;
}

export async function deliverTextFile(
  filename: string,
  contents: string,
  mime: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (Platform.OS === 'web') {
    const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  const uri = await writeTextFile(filename, contents);
  if (!uri) return 'cancelled';
  const Sharing = await import('expo-sharing');
  const available = await Sharing.isAvailableAsync();
  if (!available) return 'cancelled';
  await Sharing.shareAsync(uri, {
    mimeType: mime,
    dialogTitle: 'Guardar en Drive',
    UTI: mime.includes('csv') ? 'public.comma-separated-values-text' : 'public.json',
  });
  return 'shared';
}

export async function pickTextFile(): Promise<string | null> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (asset.file) return asset.file.text();
  const FileSystem = await import('expo-file-system');
  return new FileSystem.File(asset.uri).text();
}
