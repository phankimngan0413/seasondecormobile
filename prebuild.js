const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run expo prebuild to generate native projects
console.log('Running expo prebuild...');
execSync('npx expo prebuild --clean --platform android', { stdio: 'inherit' });

// Check if android directory exists
const androidDir = path.join(__dirname, 'android');
if (fs.existsSync(androidDir)) {
  console.log('Android directory created successfully');
  
  // Make gradlew executable
  const gradlewPath = path.join(androidDir, 'gradlew');
  if (fs.existsSync(gradlewPath)) {
    if (process.platform !== 'win32') {
      console.log('Making gradlew executable...');
      execSync(`chmod +x ${gradlewPath}`, { stdio: 'inherit' });
    }
    console.log('gradlew exists and should be executable');
  } else {
    console.error('gradlew file not found!');
  }
} else {
  console.error('Android directory not created!');
}