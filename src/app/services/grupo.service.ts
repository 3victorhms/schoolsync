import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GrupoModel } from '../model/grupo.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class GrupoService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  criar(nome: string, idSala: string): Observable<GrupoModel> {
    return this.http.post<GrupoModel>(
      `${this.API_URL}/grupos`,
      { nome, idSala }
    );
  }

  entrar(codigoConvite: string): Observable<GrupoModel> {
    return this.http.post<GrupoModel>(
      `${this.API_URL}/grupos/entrar`,
      null,
      { params: { codigoConvite } }
    );
  }

  buscarPorId(idGrupo: string): Observable<GrupoModel> {
    return this.http.get<GrupoModel>(`${this.API_URL}/grupos/${idGrupo}`);
  }

  /** Grupos do usuário logado dentro da sala. */
  listarMeusGruposDaSala(idSala: string): Observable<GrupoModel[]> {
    return this.http.get<GrupoModel[]>(`${this.API_URL}/salas/${idSala}/grupos`);
  }

  atualizar(idGrupo: string, nome: string, idSala: string): Observable<GrupoModel> {
    return this.http.put<GrupoModel>(
      `${this.API_URL}/grupos/${idGrupo}`,
      { nome, idSala }
    );
  }

  excluir(idGrupo: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/grupos/${idGrupo}`);
  }

  /** Só o líder do grupo pode remover; as tarefas do membro removido passam para o líder. */
  removerMembro(idGrupo: string, idUsuarioRemover: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/grupos/${idGrupo}/membros/${idUsuarioRemover}`);
  }

  sair(idGrupo: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/grupos/${idGrupo}/sair`);
  }
}
