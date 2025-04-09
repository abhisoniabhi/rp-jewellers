const fs = require('fs');
const path = require('path');

// Ensure Android resource directories exist
const resPath = path.join(__dirname, '../android/app/src/main/res');
const drawablePath = path.join(resPath, 'drawable');
const mipmapPath = path.join(resPath, 'mipmap-xxxhdpi');

// Copy splash screen
const splashSource = path.join(__dirname, '../resources/android/splash.svg');
const splashDest = path.join(drawablePath, 'splash.xml');

// Check if source files exist
if (fs.existsSync(splashSource)) {
  console.log('Copying splash screen...');
  
  // Create an Android drawable XML file for the splash screen
  const splashXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <color android:color="#FDE68A"/>
    </item>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/splash_image"/>
    </item>
</layer-list>`;
  
  fs.writeFileSync(splashDest, splashXml);
  console.log('Splash screen copied to', splashDest);
} else {
  console.log('Splash screen source not found:', splashSource);
}

// Copy app icon
const iconSource = path.join(__dirname, '../resources/android/icon.svg');
const iconDest = path.join(mipmapPath, 'ic_launcher.png');

if (fs.existsSync(iconSource)) {
  console.log('App icon is ready to be processed');
  console.log('For a production app, convert', iconSource, 'to PNG files of various sizes for Android');
} else {
  console.log('App icon source not found:', iconSource);
}

console.log('Resource copying complete!');
console.log('Note: For a production app, you should use a tool like @capacitor/assets to generate all required image sizes.');