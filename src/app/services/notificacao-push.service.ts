import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ActionPerformed, PushNotifications } from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { TokenService } from './token.service';

interface FirebaseInstallationPlugin {
  getId(): Promise<{ value: string }>;
}

const FirebaseInstallation = registerPlugin<FirebaseInstallationPlugin>('FirebaseInstallation');

@Injectable({ providedIn: 'root' })
export class NotificacaoPushService {
  private readonly API_URL = 'https://schoolsync-api-kvfx.onrender.com/notificacoes/push/dispositivo';
  private readonly TOKEN_STORAGE = 'schoolsyncPushToken';
  private listenersProntos?: Promise<void>;
  private registroPendente?: {
    resolve: (token: string) => void;
    reject: (erro: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone,
    private tokenService: TokenService
  ) { }

  async inicializar(): Promise<void> {
    if (!this.disponivelNoDispositivo()) return;

    await this.prepararListeners();
    if (!this.tokenService.estaValido()) return;

    const permissao = await PushNotifications.checkPermissions();
    if (permissao.receive === 'granted') {
      await this.registrar();
    }
  }

  async ativar(): Promise<void> {
    if (!this.disponivelNoDispositivo()) {
      throw new Error('As notificações push só podem ser ativadas no aplicativo instalado no celular.');
    }

    await this.prepararListeners();
    let permissao = await PushNotifications.checkPermissions();
    if (permissao.receive !== 'granted') {
      permissao = await PushNotifications.requestPermissions();
    }
    if (permissao.receive !== 'granted') {
      throw new Error('Permita as notificações do SchoolSync nas configurações do celular.');
    }

    await this.registrar();
  }

  async sincronizarAposLogin(): Promise<void> {
    if (!this.disponivelNoDispositivo()) return;

    try {
      await this.prepararListeners();
      const permissao = await PushNotifications.checkPermissions();
      if (permissao.receive === 'granted') {
        await this.registrar();
      }
    } catch (erro) {
      console.warn('Não foi possível sincronizar as notificações push.', erro);
    }
  }

  async desregistrar(): Promise<void> {
    if (!this.disponivelNoDispositivo()) return;

    const token = localStorage.getItem(this.TOKEN_STORAGE);
    try {
      if (token && this.tokenService.estaValido()) {
        const params = new HttpParams().set('token', token);
        await firstValueFrom(this.http.delete<void>(this.API_URL, { params }));
      }
    } finally {
      localStorage.removeItem(this.TOKEN_STORAGE);
      await PushNotifications.unregister().catch(() => undefined);
    }
  }

  private disponivelNoDispositivo(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  private async prepararListeners(): Promise<void> {
    if (this.listenersProntos) return this.listenersProntos;

    this.listenersProntos = Promise.all([
      PushNotifications.addListener('registration', token => this.concluirRegistro(token.value)),
      PushNotifications.addListener('registrationError', erro => {
        this.rejeitarRegistro(new Error(erro.error || 'O celular não conseguiu se registrar para receber notificações.'));
      }),
      PushNotifications.addListener('pushNotificationActionPerformed', evento => this.abrirNotificacao(evento))
    ]).then(() => undefined);

    await this.listenersProntos;
  }

  private async registrar(): Promise<void> {
    await PushNotifications.createChannel({
      id: 'schoolsync_notifications',
      name: 'Notificações SchoolSync',
      description: 'Atualizações de atividades, tarefas e grupos',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#3A6FF7'
    });

    await new Promise<string>((resolve, reject) => {
      this.limparRegistroPendente();
      const timeout = setTimeout(() => {
        this.registroPendente = undefined;
        reject(new Error('O registro das notificações demorou demais. Tente novamente.'));
      }, 15000);
      this.registroPendente = { resolve, reject, timeout };
      PushNotifications.register().catch(erro => {
        this.rejeitarRegistro(new Error(erro?.message || 'Não foi possível registrar este celular.'));
      });
    });

    const { value: token } = await FirebaseInstallation.getId();
    if (!token) {
      throw new Error('O celular não forneceu um identificador válido para as notificações.');
    }

    try {
      await firstValueFrom(this.http.post<void>(this.API_URL, { token, plataforma: 'ANDROID' }));
    } catch {
      throw new Error('Não foi possível vincular este celular à sua conta. Verifique sua internet e tente novamente.');
    }
    localStorage.setItem(this.TOKEN_STORAGE, token);
  }

  private concluirRegistro(token: string): void {
    const pendente = this.registroPendente;
    if (!pendente) return;
    clearTimeout(pendente.timeout);
    this.registroPendente = undefined;
    pendente.resolve(token);
  }

  private rejeitarRegistro(erro: Error): void {
    const pendente = this.registroPendente;
    if (!pendente) return;
    clearTimeout(pendente.timeout);
    this.registroPendente = undefined;
    pendente.reject(erro);
  }

  private limparRegistroPendente(): void {
    if (!this.registroPendente) return;
    clearTimeout(this.registroPendente.timeout);
    this.registroPendente.reject(new Error('Um novo registro de notificações foi iniciado.'));
    this.registroPendente = undefined;
  }

  private abrirNotificacao(evento: ActionPerformed): void {
    const dados = evento.notification.data || {};
    const tipo = String(dados['tipo'] || '').toUpperCase();
    const targetId = String(dados['targetId'] || '');
    if (!targetId || !this.tokenService.estaValido()) return;

    let rota: string[] | null = null;
    if (tipo.includes('GRUPO') || tipo.includes('CONVITE')) rota = ['/grupo', targetId];
    if (tipo.includes('ATIVIDADE')) rota = ['/atividade', targetId];
    if (tipo.includes('TAREFA')) rota = ['/tarefa'];
    if (rota) this.ngZone.run(() => this.router.navigate(rota));
  }
}
