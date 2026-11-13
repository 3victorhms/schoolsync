/// <reference types="@capacitor/push-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.cefetmg.schoolsync',
  appName: 'SchoolSync',
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list']
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0f1117',
      overlaysWebView: false
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false
      },
      logLevel: 1
    }
  }
};

export default config;
