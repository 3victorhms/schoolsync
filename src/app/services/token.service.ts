import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { TokenModel } from '../model/token.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  // o token fica no @capacitor/preferences (SharedPreferences no android) e n no localStorage
  // o preferences é assíncrono e o resto do app lê o token síncrono (guard, interceptor),
  // ent ele carrega uma vez na abertura do app (provideAppInitializer no main.ts) e fica em memória
  // no navegador o preferences usa o localStorage mesmo
  private readonly CHAVE = 'Authorization';
  private token = '';

  // carrega o token salvo. chamado antes de o app abrir a primeira tela
  async inicializar(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.CHAVE });
      let valor = value || '';

      // quem já estava logado tinha o token no localStorage: move para o Preferences
      const antigo = this.lerLocalStorageAntigo();
      if (!valor && antigo) {
        valor = antigo;
        await Preferences.set({ key: this.CHAVE, value: valor });
      }
      this.removerLocalStorageAntigo();
      this.token = valor;
    } catch (erro) {
      console.warn('Não foi possível ler o token salvo.', erro);
      this.token = this.lerLocalStorageAntigo();
    }
  }

  salvar(token: string | { token: string }): void {
    const valor = typeof token === 'string' ? token : token.token;
    this.token = valor || '';
    void Preferences.set({ key: this.CHAVE, value: this.token }).catch(erro =>
      console.warn('Não foi possível salvar o token.', erro));
  }

  excluir(): void {
    this.token = '';
    this.removerLocalStorageAntigo();
    void Preferences.remove({ key: this.CHAVE }).catch(() => undefined);
  }

  gerarCabecalhoAutenticacao(): HttpHeaders {
    const token = this.buscar();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  buscar(): string {
    return this.token;
  }

  // formato antigo: o token puro ou {"token": "..."} em localStorage['Authorization']
  private lerLocalStorageAntigo(): string {
    let armazenado: string | null = null;
    try { armazenado = localStorage.getItem(this.CHAVE); } catch { return ''; }
    if (!armazenado) return '';
    try {
      const valor = JSON.parse(armazenado);
      return typeof valor === 'string' ? valor : valor?.token || '';
    } catch {
      return armazenado;
    }
  }

  private removerLocalStorageAntigo(): void {
    try { localStorage.removeItem(this.CHAVE); } catch { /* sem localStorage, nada a remover */ }
  }

  possuiToken(): boolean {
    return !!this.buscar();
  }

  estaValido(): boolean {
    const token = this.buscar();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  extrair(): TokenModel {
    const tokenModel = new TokenModel();
    try {
      const tokenBase64 = this.buscar().split('.')[1];
      const tokenJson = decodeURIComponent(atob(tokenBase64.replace(/-/g, '+').replace(/_/g, '/'))
        .split('').map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
      const token = JSON.parse(tokenJson);
      tokenModel.id = token.sub;
      tokenModel.nome = token.nome;
      tokenModel.login = token.login || token.email || '';
      tokenModel.email = token.email || token.login || '';
    } catch {
      // token ausente ou inválido: devolve o model vazio, como no fluxo original
    }
    return tokenModel;
  }
}


