import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioModel } from '../model/usuario.model';
import { LoginService } from './login.service';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private API_URL_USUARIOS = 'https://schoolsync-api-kvfx.onrender.com/usuarios';

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private apiDelete: ApiDeleteService
  ) { }

  salvar(usuario: UsuarioModel): Observable<UsuarioModel> {
    if (usuario.id === "") {
      return this.cadastrar(usuario);
    }
    return this.atualizar(usuario.id, usuario);
  }

  cadastrar(usuario: UsuarioModel): Observable<UsuarioModel> {
    return this.http.post<UsuarioModel>(this.API_URL_USUARIOS, usuario);
  }

  atualizar(id: string, usuario: UsuarioModel): Observable<UsuarioModel> {
    return this.http.put<UsuarioModel>(`${this.API_URL_USUARIOS}/${id}`, usuario);
  }

  listar(): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(this.API_URL_USUARIOS);
  }

  buscarPorId(id: string): Observable<UsuarioModel> {
    return this.http.get<UsuarioModel>(`${this.API_URL_USUARIOS}/${id}`);
  }

  excluir(id: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL_USUARIOS}/${id}`);
  }

  verificarLogin(login: string): Observable<boolean> {
    const params = { email: login };
    return this.http.get<boolean>(`${this.API_URL_USUARIOS}/verificar-login`, { params });
  }

  buscarAutenticacao(): UsuarioModel {
    return this.loginService.buscarAutenticacao();
  }

}
