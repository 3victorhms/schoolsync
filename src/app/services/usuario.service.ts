import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioModel } from '../model/usuario.model';
import { LoginService } from './login.service';
import { ApiDeleteService } from './api-delete.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private readonly API_URL_USUARIOS = `${environment.apiUrl}/usuarios`;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private apiDelete: ApiDeleteService,
    private tokenService: TokenService
  ) { }

  salvar(usuario: UsuarioModel): Observable<UsuarioModel> {
    if (usuario.id === "") {
      return this.cadastrar(usuario);
    }
    return this.atualizar(usuario);
  }

  cadastrar(usuario: UsuarioModel): Observable<UsuarioModel> {
    return this.http.post<UsuarioModel>(this.API_URL_USUARIOS, usuario);
  }

  /** Atualiza a conta do usuário logado. */
  atualizar(usuario: UsuarioModel): Observable<UsuarioModel> {
    return this.http.put<UsuarioModel>(`${this.API_URL_USUARIOS}/me`, usuario, {
      headers: this.tokenService.gerarCabecalhoAutenticacao()
    });
  }

  atualizarImagem(imagemBase64: string): Observable<UsuarioModel> {
    return this.http.patch<UsuarioModel>(
      `${this.API_URL_USUARIOS}/me/imagem`,
      { imagemBase64 },
      { headers: this.tokenService.gerarCabecalhoAutenticacao() }
    );
  }

  buscarPorId(id: string): Observable<UsuarioModel> {
    return this.http.get<UsuarioModel>(`${this.API_URL_USUARIOS}/${id}`);
  }

  /** Desativa a conta do usuário logado. */
  excluirMinhaConta(): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL_USUARIOS}/me`);
  }

  verificarLogin(login: string): Observable<boolean> {
    const params = { email: login };
    return this.http.get<boolean>(`${this.API_URL_USUARIOS}/verificar-login`, { params });
  }

  buscarAutenticacao(): UsuarioModel {
    return this.loginService.buscarAutenticacao();
  }

}
