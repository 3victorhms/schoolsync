/// <reference types="@capacitor/push-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'schoolsync',
  webDir: 'www',
  plugins: {
    // No Android, usa a camada HTTP nativa para que chamadas DELETE não sejam
    // bloqueadas pelo preflight CORS do WebView.
    CapacitorHttp: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list']
    }
  }
};

export default config;
