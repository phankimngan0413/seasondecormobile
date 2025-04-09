module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
            '@assets': './assets',
            '@components': './components',
            '@constants': './constants',
            '@config': './config',
            '@hooks': './hooks',
            '@utils': './utils',
            '@services': './services',
            '@data': './data'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      ]
    ]
  };
};