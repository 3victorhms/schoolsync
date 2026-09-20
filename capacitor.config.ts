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
    },
    // Cor/estilo iniciais (tema escuro, igual o --app-bg padrão do app) —
    // evita o flash com a cor default do sistema antes do TemaService
    // assumir e sincronizar com o tema salvo do usuário.
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0f1117',
      overlaysWebView: false
    }
  }
};

export default config;
