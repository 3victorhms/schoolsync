import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ID_NOTIFICACAO_TESTE = 20260820;

@Injectable({ providedIn: 'root' })
export class NotificacaoLocalService {

  async agendarTesteEmUmMinuto(): Promise<Date> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Este teste funciona somente no aplicativo instalado no celular.');
    }

    let permissao = await LocalNotifications.checkPermissions();
    if (permissao.display !== 'granted') {
      permissao = await LocalNotifications.requestPermissions();
    }

    if (permissao.display !== 'granted') {
      throw new Error('A permissão de notificações foi negada. Ative-a nas configurações do celular e tente novamente.');
    }

    const horario = new Date(Date.now() + 60_000);

    // Mantém apenas um teste pendente para evitar notificações duplicadas.
    await LocalNotifications.cancel({ notifications: [{ id: ID_NOTIFICACAO_TESTE }] });

    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: ID_NOTIFICACAO_TESTE,
          title: 'Teste do SchoolSync',
          body: 'Tudo certo! As notificações funcionam mesmo com o aplicativo fechado.',
          schedule: { at: horario, allowWhileIdle: true },
          foreground: true,
          isExactNotification: true,
          isExactMandatory: true,
          autoCancel: true,
          extra: { tipo: 'TESTE_NOTIFICACAO' }
        }]
      });
    } catch (erro: any) {
      const detalhe = String(erro?.message || erro || '').toLowerCase();
      if (detalhe.includes('exact') || detalhe.includes('alarm')) {
        throw new Error('Autorize “Alarmes e lembretes” para o SchoolSync e toque no botão novamente. Essa permissão permite avisar exatamente após 1 minuto.');
      }
      throw new Error('Não foi possível agendar a notificação. Confira as permissões do SchoolSync no celular.');
    }

    return horario;
  }
}
