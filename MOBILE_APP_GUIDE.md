# Mobile App Setup Guide for Play Store

This guide will walk you through the process of converting your RP Jewellers web app into a mobile app for the Google Play Store.

## Prerequisites

Before starting, make sure you have:

1. Node.js and npm installed
2. Android Studio installed
3. Java Development Kit (JDK) 8 or newer
4. Your web app is already built and working properly

## Step 1: Install Required Packages

Install Capacitor and related packages:

```bash
# Install Capacitor core packages
npm install @capacitor/core @capacitor/cli @capacitor/android

# Install additional useful plugins
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app @capacitor/preferences @capacitor/share
```

## Step 2: Initialize Capacitor

Initialize Capacitor in your project:

```bash
# Initialize Capacitor (already configured in capacitor.config.ts)
npx cap init
```

## Step 3: Add Android Platform

Add the Android platform to your project:

```bash
npx cap add android
```

## Step 4: Modify Your App for Mobile

Ensure your web app is responsive and mobile-friendly:

1. Test on different screen sizes
2. Ensure touch targets are appropriately sized (at least 44x44px)
3. Make sure text is readable on mobile screens
4. Test all features in a mobile browser

## Step 5: Build Your Web App

Build your web app to generate the dist folder:

```bash
npm run build
```

## Step 6: Copy Web Code to Android Project

Copy your built web code to the Android project:

```bash
npx cap copy android
```

## Step 7: Generate App Icons and Splash Screens

Create app icons and splash screens:

1. Create a high-resolution logo (at least 1024x1024px)
2. Use Capacitor's assets generator:

```bash
# Install capacitor assets generator
npm install --save-dev @capacitor/assets

# Generate app icons and splash screens
npx capacitor-assets generate
```

## Step 8: Update App Configuration

The `capacitor.config.ts` file in your project root is already configured. It includes:

- App ID (package name): `io.rpjewellers.app`
- App name: "RP Jewellers"
- Web directory: `dist`
- Server configuration for connecting to your Render deployment
- Splash screen settings

## Step 9: Open and Configure Android Project

Open the Android project in Android Studio:

```bash
npx cap open android
```

In Android Studio:

1. Update `android/app/src/main/res/values/strings.xml` with your app name:
   ```xml
   <resources>
       <string name="app_name">RP Jewellers</string>
       <string name="title_activity_main">RP Jewellers</string>
       <string name="package_name">io.rpjewellers.app</string>
       <string name="custom_url_scheme">io.rpjewellers.app</string>
   </resources>
   ```

2. Configure the app theme in `android/app/src/main/res/values/styles.xml` if needed

## Step 10: Enable Required Permissions

The Android manifest file at `android/app/src/main/AndroidManifest.xml` needs certain permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- Add for WhatsApp sharing -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Step 11: Test on Android Device or Emulator

Before building for the Play Store, test your app:

1. Connect an Android device or start an emulator
2. Click "Run" in Android Studio to build and run the app
3. Test all functionality thoroughly

## Step 12: Prepare for Release

Create a signed APK or App Bundle for the Play Store:

1. In Android Studio, go to Build > Generate Signed Bundle/APK
2. Select Android App Bundle or APK (App Bundle is recommended)
3. Create a new key store if you don't have one:
   - Set a strong password
   - Fill in the certificate information
   - Remember to safely store the keystore file and passwords
4. Choose release build variant
5. Click Finish to generate the signed bundle/APK

## Step 13: Create a Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console/signup)
2. Sign up for a Google Play Developer account ($25 one-time fee)
3. Complete the account setup process

## Step 14: Prepare Store Listing

Prepare the following materials for your Play Store listing:

1. App screenshots (at least 2) for various devices:
   - Phone screenshots (16:9 ratio)
   - 7-inch tablet screenshots
   - 10-inch tablet screenshots

2. App icon (512x512px)

3. Feature graphic (1024x500px)

4. Short description (up to 80 characters)

5. Full description (up to 4000 characters)

6. Privacy policy URL

## Step 15: Submit to Google Play Store

In the Google Play Console:

1. Create a new app
2. Fill in the store listing details
3. Set up content rating by completing the questionnaire
4. Configure pricing and distribution
5. Upload your signed App Bundle or APK
6. Submit for review

## Step 16: Monitor and Update

After publishing:

1. Monitor crash reports and user feedback
2. Make regular updates to address issues and add features
3. For updates, follow steps 4-5 and then:
   ```bash
   npm run build
   npx cap copy android
   npx cap sync android
   ```
4. Open in Android Studio, create a new release, and upload to Play Store

## Additional Tips for a Successful Mobile App

1. **Offline Support**: Consider implementing offline capabilities so users can access some features without internet connection

2. **Push Notifications**: Implement push notifications for important updates, such as rate changes or order status updates

3. **Deep Linking**: Set up deep links to allow users to share specific product or collection pages

4. **Performance Optimization**: Optimize images and assets for mobile devices to ensure fast loading

5. **Analytics**: Implement Google Analytics or Firebase Analytics to track user behavior

6. **App Indexing**: Enable Google App Indexing to make your app content discoverable in Google Search

7. **User Feedback**: Add an in-app feedback mechanism to collect user suggestions

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Documentation](https://developer.android.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Material Design Guidelines](https://material.io/design)
- [PWA Builder](https://www.pwabuilder.com/) - Alternative tool to convert your web app to a mobile app