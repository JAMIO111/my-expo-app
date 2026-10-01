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
      favicon: './app/assets/BR-Logo-1024-Background.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-apple-authentication',
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/BR-Logo-1024-Background.png',
          color: '#d4922a',
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          // Source maps are uploaded at build time. Needs SENTRY_AUTH_TOKEN as an EAS secret.
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.ADMOB_IOS_APP_ID,
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: 'com.googleusercontent.apps.415242977318-ngh1diqg41aki3dbp70vd5h7qatdne66',
        },
      ],
    ],
    orientation: 'portrait',
    icon: './app/assets/BR-Logo-1024-Background.png',
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
      usesAppleSignIn: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: 'Breakroom requires access to your photo library.',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      package: 'com.jdigital.breakroom',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      adaptiveIcon: {
        foregroundImage: './app/assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
      ADMOB_IOS_BANNER_ID: process.env.ADMOB_IOS_BANNER_ID,
      ADMOB_ANDROID_BANNER_ID: process.env.ADMOB_ANDROID_BANNER_ID,
      APP_ENV: env,
      eas: {
        projectId: '3e7c3732-0ff2-449b-a27e-89d2cb14ada2',
      },
    },
    updates: {
      url: 'https://u.expo.dev/3e7c3732-0ff2-449b-a27e-89d2cb14ada2',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  };
};
