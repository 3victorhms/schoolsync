/// <reference types="@capacitor/push-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.cefetmg.schoolsync',
  appName: 'SchoolSync',
  webDir: 'www',
  plugins: {
    // no android usa o http nativo, senão o preflight do CORS no WebView bloqueia os DELETE
    CapacitorHttp: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list']
    },
    // cor inicial da status bar (a do tema escuro), pra n piscar a cor padrão do sistema antes do TemaService carregar o tema salvo
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0f1117',
      overlaysWebView: false
    },
    // login com google. os outros provedores ficam de fora pra n pesar o APK
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
