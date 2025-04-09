# Deployment Guide for RP Jewellers App

This guide will walk you through deploying the RP Jewellers app to Render and preparing it for the Play Store.

## Deploying to Render

### 1. Create a Render Account

If you don't already have a Render account, sign up at [render.com](https://render.com).

### 2. Create a New Web Service

1. From the Render dashboard, click "New" and select "Web Service"
2. Connect your GitHub or GitLab repository
3. Find and select your repository

### 3. Configure Your Web Service

Use the following settings:
- **Name**: rp-jewellers (or your preferred name)
- **Environment**: Node
- **Region**: Choose the region closest to your users (e.g., Singapore for Indian users)
- **Branch**: main (or your default branch)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `NODE_ENV=production node dist/index.js`
- **Auto Deploy**: Enabled

### 4. Environment Variables

Add the following environment variables:
- `NODE_ENV`: production
- `SESSION_SECRET`: (a random string for session security)
- `PORT`: 3000

### 5. Deploy the Service

Click "Create Web Service" to start the deployment process. Render will build and deploy your application.

## Preparing for the Play Store

### 1. Install Capacitor

To convert your web app to an Android app, you'll need to use Capacitor. Here's how to set it up:

```bash
# Install Capacitor CLI and core packages locally
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor in your project
npx cap init RP-Jewellers io.rpjewellers.app --web-dir dist

# Add Android platform
npx cap add android
```

### 2. Configure Capacitor

Create a `capacitor.config.ts` file in the root of your project with the following content:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.rpjewellers.app',
  appName: 'RP Jewellers',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#FDE68A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#B45309",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
```

### 3. Create App Icons and Splash Screen

1. Create app icons in different sizes for Android using an online tool like [AppIcon Generator](https://appicon.co/)
2. Create a splash screen image (1200x1200px with your logo centered)
3. Copy these files to the Android resources directory:
   ```bash
   npx capacitor-assets generate
   ```

### 4. Update Android Manifest

Edit the `android/app/src/main/AndroidManifest.xml` file to ensure proper permissions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="io.rpjewellers.app.MainActivity"
            android:label="@string/app_name"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

### 5. Build the Android App

```bash
# Build your web app
npm run build

# Copy web assets to Android project
npx cap copy android

# Sync project (do this after any plugin change)
npx cap sync android

# Open in Android Studio to build
npx cap open android
```

### 6. Build APK in Android Studio

1. Open your project in Android Studio
2. Go to Build > Generate Signed Bundle/APK
3. Choose APK and follow the steps to create a signing key
4. Choose release build variant
5. Click 'Create' to generate the APK

### 7. Prepare for Play Store Submission

1. Create a Google Play Developer account (one-time fee of $25)
2. Prepare screenshots in different sizes (phone, tablet)
3. Create a privacy policy
4. Write app descriptions (short and full)
5. Submit your app through the Google Play Console

## Important Notes for Production

1. For a production app, set up a proper database (PostgreSQL recommended)
2. Configure proper session management with secure cookies
3. Implement HTTPS for secure communication
4. Set up proper error logging
5. Implement analytics to track user behavior
6. Create a customer support system

## Troubleshooting

If you encounter issues during deployment:

1. Check Render logs for any build or runtime errors
2. Ensure all environment variables are correctly set
3. Verify that the start command is correctly specified
4. For mobile app issues, consult the Capacitor documentation

For more detailed instructions, refer to:
- [Render Documentation](https://render.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)