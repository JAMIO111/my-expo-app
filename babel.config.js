module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './app',
            '@components': './app/components',
            '@assets': './app/assets',
            '@hooks': './app/hooks',
            '@lib': './app/lib',
            '@contexts': './app/contexts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
