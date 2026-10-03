import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalaModel, SalaRequest } from '../model/sala.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class SalaService {

  private readonly API_URL = `${environment.apiUrl}/salas`;

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  /** Cria a sala (sem idSala) ou edita nome, matérias e períodos de uma existente. */
  salvar(dados: SalaRequest, idSala?: string): Observable<SalaModel> {
    if (idSala) {
      return this.atualizar(idSala, dados);
    }

    // O usuário logado (dono do token) vira o líder da sala
    return this.http.post<SalaModel>(this.API_URL, dados);
  }

  atualizar(id: string, dados: SalaRequest): Observable<SalaModel> {
    return this.http.put<SalaModel>(
      `${this.API_URL}/${id}`,
      dados
    );
  }

  entrar(codigoConvite: string): Observable<SalaModel> {
    return this.http.post<SalaModel>(
      `${this.API_URL}/entrar`,
      null,
      { params: { codigoConvite } }
    );
  }

  /** Salas do usuário logado. */
  listarMinhas(): Observable<SalaModel[]> {
    return this.http.get<SalaModel[]>(this.API_URL);
  }

  buscarPorId(id: string): Observable<SalaModel> {
    return this.http.get<SalaModel>(`${this.API_URL}/${id}`);
  }

  excluir(id: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/${id}`);
  }

  sairDaSala(idSala: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/${idSala}/sair`);
  }

  removerMembro(idSala: string, idUsuarioRemover: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/${idSala}/membros/${idUsuarioRemover}`);
  }
}
