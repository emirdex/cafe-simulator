import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.arcbyte.kafezinciri',
  appName: 'Kafe Zinciri',
  webDir: 'www',
  backgroundColor: '#111214',
  ios: { contentInset: 'never', scrollEnabled: false, backgroundColor: '#111214' },
  android: { backgroundColor: '#111214', allowMixedContent: false },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#111214', showSpinner: false, androidScaleType: 'CENTER_CROP' },
    StatusBar: { overlaysWebView: true, style: 'DARK' }
  }
};

export default config;
