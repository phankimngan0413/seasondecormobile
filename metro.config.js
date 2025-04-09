const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add the additional extensions to assetExts
config.resolver.assetExts.push(
  // Add any other asset extensions you might be using
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf'
);

module.exports = config;