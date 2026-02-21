// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  const env = process.env.APP_ENV || 'development';
  const isDev = env === 'development';

  return {
    ...config,

    scheme: 'breakroom',
    name: 'Break Room',
    owner: 'jdigital',
    slug: 'break-room',
    version: '1.0.0',
    web: {
      favicon: './app/assets/Break-Room-Logo-1024-Background.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      '@react-native-google-signin/google-signin',
      {
        iosURLScheme: 'com.googleusercontent.apps.415242977318-ngh1diqg41aki3dbp70vd5h7qatdne66',
      },
    ],
    orientation: 'portrait',
    icon: './app/assets/Break-Room-Logo-1024-Background.png',
    userInterfaceStyle: 'automatic',
    jsEngine: 'hermes',
    newArchEnabled: true,
    splash: {
      image: './app/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'com.jdigital.breakroom',
      googleServicesFile: './GoogleService-Info.plist',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: 'This app needs access to your photo library.',
      },
    },
    android: {
      package: 'com.jdigital.breakroom',
      googleServicesFile: isDev ? './google-services-dev.json' : './google-services-prod.json',
      adaptiveIcon: {
        foregroundImage: './app/assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      eas: {
        projectId: '3e7c3732-0ff2-449b-a27e-89d2cb14ada2',
      },
    },
  };
};
