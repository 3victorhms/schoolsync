import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsuarioModel } from '../model/usuario.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_URL = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // a API só responde pra quem tem perfil ADMIN (hasRole("ADMIN") no SecurityConfig).
  // qualquer outro usuário logado recebe 403
  listarUsuarios(): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(`${this.API_URL}/usuarios`);
  }

  // promove a ADMIN ou volta pra USUARIO. a API n deixa o admin mudar o próprio perfil
  alterarPerfil(idUsuario: string, perfil: 'ADMIN' | 'USUARIO'): Observable<UsuarioModel> {
    return this.http.put<UsuarioModel>(`${this.API_URL}/usuarios/${idUsuario}/perfil`, { perfil });
  }
}
