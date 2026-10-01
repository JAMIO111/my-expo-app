const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// getSentryExpoConfig = Expo's default Metro config plus Sentry's source map support
const config = getSentryExpoConfig(process.cwd());

module.exports = withNativeWind(config, {
  input: './global.css',
});
