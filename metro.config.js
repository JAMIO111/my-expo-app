const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Add your aliases
config.resolver.alias = {
  '@': './app',
  '@components': './app/components',
  '@assets': './app/assets',
  '@hooks': './app/hooks',
  '@lib': './app/lib',
  '@contexts': './app/contexts',
};

// Exclude prettier folder from bundling
config.resolver.blacklistRE = exclusionList([/prettier\/.*/]);

module.exports = withNativeWind(config, { input: './global.css' });
