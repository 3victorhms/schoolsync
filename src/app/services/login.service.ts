import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UsuarioModel } from '../model/usuario.model';
import { TokenService } from './token.service';

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly API_URL = 'http://localhost:8080/usuarios';
  private readonly USUARIO_AUTENTICADO = 'usuarioAutenticado';

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  autenticar(credenciais: CredenciaisLogin): Observable<string> {
    return this.http.post(`${this.API_URL}/autenticar`, credenciais, { responseType: 'text' }).pipe(
      tap(token => this.tokenService.salvar(token))
    );
  }

  buscarAutenticacao(): UsuarioModel {
    return JSON.parse(localStorage.getItem(this.USUARIO_AUTENTICADO) || '{}');
  }

  registrarAutenticacao(usuario: UsuarioModel): void {
    const usuarioAnterior = this.buscarAutenticacao();
    if (usuarioAnterior?.id && usuarioAnterior.id !== usuario.id) {
      localStorage.removeItem(`ultimaSala:${usuarioAnterior.id}`);
    }
    localStorage.setItem(this.USUARIO_AUTENTICADO, JSON.stringify(usuario));
  }

  encerrarAutenticacao(): void {
    this.tokenService.excluir();
    localStorage.removeItem(this.USUARIO_AUTENTICADO);
    localStorage.removeItem('ultimaSala');
  }
}
