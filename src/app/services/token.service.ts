import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { TokenModel } from '../model/token.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly AUTORIZACAO_USUARIO = 'Authorization';

  salvar(token: string | { token: string }): void {
    const valor = typeof token === 'string' ? token : token.token;
    localStorage.setItem(this.AUTORIZACAO_USUARIO, valor);
  }

  excluir(): void {
    localStorage.removeItem(this.AUTORIZACAO_USUARIO);
  }

  gerarCabecalhoAutenticacao(): HttpHeaders {
    const token = this.buscar();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  buscar(): string {
    const armazenado = localStorage.getItem(this.AUTORIZACAO_USUARIO);
    if (!armazenado) return '';

    try {
      const valor = JSON.parse(armazenado);
      return typeof valor === 'string' ? valor : valor?.token || '';
    } catch {
      return armazenado;
    }
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
      // Token ausente ou inválido: devolve o model vazio, como no fluxo original.
    }
    return tokenModel;
  }
}


