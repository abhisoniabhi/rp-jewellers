import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.rpjewellers.app',
  appName: 'RP Jewellers',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'your-render-app-name.onrender.com',
    cleartext: true
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