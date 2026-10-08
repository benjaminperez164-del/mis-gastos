import type { ConfigContext, ExpoConfig } from 'expo/config';

const BASE_PATH = '/mis-gastos';
const version = (process.env.APP_VERSION || '1.0.0').replace(/^v/, '');
const versionCode = Number(process.env.ANDROID_VERSION_CODE || 1);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Mis Gastos',
  slug: 'mis-gastos',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'misgastos',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.benjaminperez.misgastos',
  },
  android: {
    package: 'com.benjaminperez.misgastos',
    versionCode,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F766E',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0F766E',
        image: './assets/splash-icon.png',
        imageWidth: 180,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Mis Gastos usa tus fotos para adjuntar comprobantes.',
        cameraPermission: 'Mis Gastos usa la cámara para fotografiar comprobantes.',
      },
    ],
  ],
  experiments: {
    baseUrl: process.env.EXPO_BASE_URL || BASE_PATH,
    tsconfigPaths: true,
  },
  extra: {
    supportsRTL: false,
  },
});
