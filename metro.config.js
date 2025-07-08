const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './app',
  '@components': './app/components',
  '@assets': './app/assets',
  '@hooks': './app/hooks',
  '@lib': './app/lib',
  '@contexts': './app/contexts',
};

module.exports = withNativeWind(config, { input: './global.css' });
