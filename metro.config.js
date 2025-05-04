const path = require('path'); // Add this line at the top

const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  const { resolver } = config;
  
  config.resolver = {
    ...resolver,
    extraNodeModules: new Proxy({}, {
      get: (target, name) => {
        return path.join(__dirname, `${name}`)
      },
    }),
  };
  
  return config;
})();