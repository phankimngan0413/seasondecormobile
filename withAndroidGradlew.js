const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidGradlew = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlewPath = path.join(config.modRequest.platformProjectRoot, 'gradlew');
      
      // Ensure gradlew file exists and is executable
      if (!fs.existsSync(gradlewPath)) {
        console.log('Creating gradlew file...');
        // Create a basic gradlew script if it doesn't exist
        fs.writeFileSync(gradlewPath, '#!/bin/bash\n./gradlew.bat "$@"');
      }
      
      // Make it executable
      fs.chmodSync(gradlewPath, '755');
      
      return config;
    },
  ]);
};

module.exports = withAndroidGradlew;