# Icon Generation Guide

This guide will help you generate the necessary icons for your PWA and Android app.

## App Icon Generation

We've provided an SVG icon template at `client/public/icons/icon-512x512.svg`. You'll need to convert this to various PNG sizes for both the PWA and Android app.

### Method 1: Using Online Tools

1. Use an online SVG to PNG converter like [Convertio](https://convertio.co/svg-png/) or [SVGOMG](https://jakearchibald.github.io/svgomg/)
2. Upload the SVG file and convert it to the following sizes:
   - 72x72 px
   - 96x96 px
   - 128x128 px
   - 144x144 px
   - 152x152 px
   - 192x192 px
   - 384x384 px
   - 512x512 px
3. Save each file with the appropriate name (e.g., `icon-72x72.png`)
4. Place all PNG files in the `client/public/icons/` directory

### Method 2: Using Automated Tools

If you have Node.js installed, you can use the PWA Asset Generator:

```bash
# Install the generator globally
npm install -g pwa-asset-generator

# Generate icons from the SVG
pwa-asset-generator client/public/icons/icon-512x512.svg client/public/icons --icon-only --favicon

# This will create icons of all required sizes
```

## Android App Icon Generation

For the Android app, you'll need additional formats:

1. Open the SVG in an image editor like Adobe Illustrator, Figma, or Inkscape
2. Export the icon in Android-specific formats:
   - Generate an adaptive icon with:
     - Foreground layer (the RP Jewellers logo)
     - Background layer (the gold background)
   - Export as ic_launcher.png in various densities:
     - mdpi (48x48 px)
     - hdpi (72x72 px)
     - xhdpi (96x96 px)
     - xxhdpi (144x144 px)
     - xxxhdpi (192x192 px)

### Using Android Studio

The easiest way to generate Android-specific icons is to:

1. Open the Android project in Android Studio (after running `npx cap add android`)
2. Right-click on the app > New > Image Asset
3. Select the "Icon Type" as "Launcher Icons (Adaptive and Legacy)"
4. Upload your foreground layer (the logo) and set a background color
5. Click Next and then Finish

## Splash Screen Image

For the splash screen:

1. Create a 1200x1200 px PNG image with your logo centered
2. Save it as `splash.png`
3. Place it in the appropriate Android resources directory when setting up Capacitor

## Where to Place the Files

- For PWA: All icons should go in `client/public/icons/`
- For Android: The Android Studio tool will place files correctly, or manually place them in:
  ```
  android/app/src/main/res/mipmap-{density}/ic_launcher.png
  android/app/src/main/res/mipmap-{density}/ic_launcher_round.png
  ```

## Next Steps

After generating all icons:

1. Update the web manifest file (`client/public/manifest.json`) to reference all icon sizes
2. For Android, sync your Capacitor project with `npx cap sync android`
3. Test the PWA by building and serving your web app
4. Test the Android app by opening it in Android Studio and running on a device or emulator