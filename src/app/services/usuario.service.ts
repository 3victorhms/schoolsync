import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioModel } from '../model/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private API_URL_USUARIOS = 'http://localhost:8080/usuarios';

  constructor(private http: HttpClient) { }

  salvar(usuario: UsuarioModel): Observable<UsuarioModel> {
    if (usuario.id === "") {
      return this.http.post<UsuarioModel>(this.API_URL_USUARIOS, usuario);
    } else {
      return this.http.put<UsuarioModel>(`${this.API_URL_USUARIOS}/${usuario.id}`, usuario);
    }
  }

  listar(): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(this.API_URL_USUARIOS);
  }

  buscarPorId(id: string): Observable<UsuarioModel> {
    return this.http.get<UsuarioModel>(`${this.API_URL_USUARIOS}/${id}`);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_USUARIOS}/${id}`);
  }

  autenticar(login: string, senha: string): Observable<UsuarioModel> {
    const params = { email: login, senha: senha };
    return this.http.post<UsuarioModel>(`${this.API_URL_USUARIOS}/autenticar`, null, { params });
  }

  verificarLogin(login: string): Observable<boolean> {
    const params = { email: login };
    return this.http.get<boolean>(`${this.API_URL_USUARIOS}/verificar-login`, { params });
  }

  buscarAutenticacao(): UsuarioModel {
    let usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}');
    return usuario;
  }

  registrarAutenticacao(usuario: UsuarioModel) {
    localStorage.setItem('usuarioAutenticado', JSON.stringify(usuario));
  }

  encerrarAutenticacao() {
    localStorage.removeItem('usuarioAutenticado');
  }
}