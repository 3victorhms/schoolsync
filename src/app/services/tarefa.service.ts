import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TarefaModel } from '../model/tarefa.model';

@Injectable({
  providedIn: 'root',
})
export class TarefaService {

  private readonly API_URL = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  listarPorGrupo(idGrupo: string, idUsuarioLogado: string): Observable<TarefaModel[]> {
    return this.http.get<TarefaModel[]>(
      `${this.API_URL}/grupos/${idGrupo}/tarefas`,
      { params: { idUsuarioLogado } }
    );
  }

  listarPorUsuario(idUsuario: string): Observable<TarefaModel[]> {
    return this.http.get<TarefaModel[]>(
      `${this.API_URL}/tarefas/usuario/${idUsuario}`
    );
  }

  criar(idGrupo: string, titulo: string, idAtividade: string, idUsuarioAtribuido: string, idUsuarioLogado: string): Observable<TarefaModel> {
    return this.http.post<TarefaModel>(
      `${this.API_URL}/grupos/${idGrupo}/tarefas`,
      { titulo, idAtividade, idUsuarioAtribuido, idUsuarioLogado }
    );
  }

  alterarStatus(idTarefa: string, status: string, idUsuarioLogado: string): Observable<TarefaModel> {
    return this.http.put<TarefaModel>(
      `${this.API_URL}/tarefas/${idTarefa}/status`,
      { status, idUsuarioLogado }
    );
  }

  excluir(idTarefa: string, idUsuarioLogado: string): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/tarefas/${idTarefa}`,
      { params: { idUsuarioLogado } }
    );
  }
}
