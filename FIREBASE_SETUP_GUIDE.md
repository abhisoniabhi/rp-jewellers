# Firebase Setup Guide

This document explains how to set up Firebase Authentication and Firebase Cloud Messaging (FCM) for your RP Jewellers application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired
4. Click "Create project"

## Step 2: Add Firebase to your Web App

1. In the Firebase Console, click the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "RP Jewellers Web")
3. Register the app
4. Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

5. Replace the placeholder configuration in `client/src/lib/firebase.ts` with your actual Firebase config

## Step 3: Set Up Firebase Authentication

1. In the Firebase Console, go to the Authentication section
2. Click "Get started" button
3. Enable the "Email/Password" sign-in method
4. Enable the "Phone" sign-in method
   - You may need to add a phone number for testing
   - For production, you might need to upgrade to a paid plan

## Step 4: Set Up Firebase Cloud Messaging (FCM)

1. In the Firebase Console, go to the Cloud Messaging section
2. Click "Get started" button
3. Generate a VAPID key:
   - Go to Project Settings > Cloud Messaging
   - Under "Web Push certificates", click "Generate key pair"
4. Copy the key and replace it in `client/src/lib/firebase.ts` for the `vapidKey` value

## Step 5: Add Firebase to your Android App

1. In the Firebase Console, click the Android icon to add an Android app
2. Enter your Android package name (check `android/app/build.gradle` for the applicationId)
3. Register the app
4. Download the `google-services.json` file

## Step 6: Add google-services.json to your Android App

1. Place the downloaded `google-services.json` file in the `android/app/` directory
2. Make sure it's at this exact path: `android/app/google-services.json`

## Step 7: Build Your Android App

1. Make sure you've installed the Capacitor Android platform:
   ```
   npx cap add android
   ```

2. Sync your web code to the Android project:
   ```
   npx cap sync android
   ```

3. Open the Android project in Android Studio:
   ```
   npx cap open android
   ```

4. Build and run the app from Android Studio

## Troubleshooting

### Push Notifications Not Working

1. Check that `google-services.json` is correctly placed in the `android/app/` directory
2. Verify that you've enabled the necessary permissions in `AndroidManifest.xml`
3. Make sure your Firebase project has Cloud Messaging API enabled
4. Check your device's notification settings

### Authentication Issues

1. Verify that you've enabled the authentication methods in the Firebase Console
2. Check the Firebase configuration in `client/src/lib/firebase.ts`
3. For phone authentication issues, ensure your phone number is in the correct format (+[country code][phone number])

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)