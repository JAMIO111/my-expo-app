// app.config.js
import 'dotenv/config';

export default () => ({
  expo: {
    scheme: 'Break-Room',
    name: 'Break Room',
    owner: 'jdigital',
    slug: 'break-room',
    version: '1.0.0',
    web: {
      favicon: './assets/Break-Room-Logo-1024-Background.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: ['expo-router', 'expo-font'],
    orientation: 'portrait',
    icon: './assets/Break-Room-Logo-1024-Background.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'com.jdigital.breakroom',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.jdigital.breakroom',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
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
  },
});
