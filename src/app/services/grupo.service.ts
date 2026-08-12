import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GrupoModel } from '../model/grupo.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class GrupoService {

  private readonly API_URL = 'https://schoolsync-api-kvfx.onrender.com';

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  criar(nome: string, idSala: string, idCriador: string): Observable<GrupoModel> {
    return this.http.post<GrupoModel>(
      `${this.API_URL}/grupos`,
      { nome, idSala, idCriador }
    );
  }

  entrar(codigoConvite: string, idUsuario: string): Observable<GrupoModel> {
    return this.http.post<GrupoModel>(
      `${this.API_URL}/grupos/entrar`,
      null,
      { params: { codigoConvite, idUsuario } }
    );
  }

  buscarPorId(idGrupo: string, idUsuarioLogado: string): Observable<GrupoModel> {
    return this.http.get<GrupoModel>(
      `${this.API_URL}/grupos/${idGrupo}`,
      { params: { idUsuarioLogado } }
    );
  }

  listarPorSalaEUsuario(idSala: string, idUsuario: string): Observable<GrupoModel[]> {
    return this.http.get<GrupoModel[]>(
      `${this.API_URL}/salas/${idSala}/grupos/usuario/${idUsuario}`
    );
  }

  atualizar(idGrupo: string, nome: string, idSala: string, idCriador: string): Observable<GrupoModel> {
    return this.http.put<GrupoModel>(
      `${this.API_URL}/grupos/${idGrupo}`,
      { nome, idSala, idCriador }
    );
  }

  excluir(idGrupo: string, idUsuarioLogado: string): Observable<void> {
    return this.apiDelete.excluir(
      `${this.API_URL}/grupos/${idGrupo}`,
      { idUsuarioLogado }
    );
  }

  sair(idGrupo: string, idUsuario: string): Observable<void> {
    return this.apiDelete.excluir(
      `${this.API_URL}/grupos/${idGrupo}/sair`,
      { idUsuario }
    );
  }
}
