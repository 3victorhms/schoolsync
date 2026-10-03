import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TarefaModel } from '../model/tarefa.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class TarefaService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  listarPorGrupo(idGrupo: string): Observable<TarefaModel[]> {
    return this.http.get<TarefaModel[]>(`${this.API_URL}/grupos/${idGrupo}/tarefas`);
  }

  /** Tarefas atribuídas ao usuário logado. */
  listarMinhas(): Observable<TarefaModel[]> {
    return this.http.get<TarefaModel[]>(`${this.API_URL}/tarefas`);
  }

  criar(idGrupo: string, titulo: string, idAtividade: string, idUsuarioAtribuido: string): Observable<TarefaModel> {
    return this.http.post<TarefaModel>(
      `${this.API_URL}/grupos/${idGrupo}/tarefas`,
      { titulo, idAtividade, idUsuarioAtribuido }
    );
  }

  alterarStatus(idTarefa: string, status: string): Observable<TarefaModel> {
    return this.http.put<TarefaModel>(
      `${this.API_URL}/tarefas/${idTarefa}/status`,
      { status }
    );
  }

  excluir(idTarefa: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/tarefas/${idTarefa}`);
  }
}
