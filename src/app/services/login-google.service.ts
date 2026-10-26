import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { GoogleLoginResponseOnline, SocialLogin } from '@capgo/capacitor-social-login';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RespostaLogin } from './login.service';
import { TokenService } from './token.service';

// login com google. no android abre a escolha de conta do próprio sistema; no navegador abre um
// popup do google que volta pra /login (é a url cadastrada no Google Cloud). o app manda o ID token
// pra API, que confere com o google e devolve o mesmo JWT do login normal
@Injectable({ providedIn: 'root' })
export class LoginGoogleService {
  readonly disponivel = !!environment.googleClientId;
  private iniciando: Promise<void> | null = null;

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  // no navegador precisa rodar cedo (carrega o script do google e, dentro do popup, devolve o resultado)
  preparar(): Promise<void> {
    if (!this.disponivel) return Promise.resolve();
    if (!this.iniciando) {
      this.iniciando = SocialLogin.initialize({
        google: {
          webClientId: environment.googleClientId,
          ...(Capacitor.getPlatform() === 'web' ? { redirectUrl: `${window.location.origin}/login` } : {})
        }
      }).catch(erro => {
        this.iniciando = null;
        throw erro;
      });
    }
    return this.iniciando;
  }

  async entrar(): Promise<RespostaLogin> {
    await this.preparar();
    const resposta = await SocialLogin.login({ provider: 'google', options: {} });
    const idToken = (resposta.result as GoogleLoginResponseOnline)?.idToken;
    if (!idToken) throw new Error('O Google n devolveu o token');

    const login = await firstValueFrom(
      this.http.post<RespostaLogin>(`${environment.apiUrl}/usuarios/google`, { idToken })
    );
    this.tokenService.salvar(login.token);
    return login;
  }

  // a pessoa fechou a janela ou voltou sem escolher conta
  cancelou(erro: any): boolean {
    const mensagem = String(erro?.message || erro || '').toLowerCase();
    return erro?.code === 'USER_CANCELLED' || mensagem.includes('cancel') || mensagem.includes('popup closed');
  }
}
