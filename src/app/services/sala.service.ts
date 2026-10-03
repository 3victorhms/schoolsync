import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalaModel, SalaRequest } from '../model/sala.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class SalaService {

  private readonly API_URL = 'https://schoolsync-api-kvfx.onrender.com/salas';

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  /** Cria a sala (sem idSala) ou edita nome, matérias e períodos de uma existente. */
  salvar(dados: SalaRequest, idLider: string, idSala?: string): Observable<SalaModel> {
    if (idSala) {
      return this.atualizar(idSala, dados);
    }

    return this.http.post<SalaModel>(
      `${this.API_URL}?idLider=${idLider}`,
      dados
    );
  }

  atualizar(id: string, dados: SalaRequest): Observable<SalaModel> {
    return this.http.put<SalaModel>(
      `${this.API_URL}/${id}`,
      dados
    );
  }

  entrar(codigoConvite: string, idUsuario: string): Observable<SalaModel> {
    return this.http.post<SalaModel>(
      `${this.API_URL}/entrar`,
      null,
      { params: { codigoConvite, idUsuario } }
    );
  }

  listarPorUsuario(idUsuario: string): Observable<SalaModel[]> {
    return this.http.get<SalaModel[]>(
      `${this.API_URL}/usuario/${idUsuario}`
    );
  }

  buscarPorId(id: string, idUsuarioLogado: string): Observable<SalaModel> {
    return this.http.get<SalaModel>(
      `${this.API_URL}/${id}?idUsuarioLogado=${idUsuarioLogado}`
    );
  }

  excluir(id: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/${id}`);
  }

  sairDaSala(idSala: string, idUsuario: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/${idSala}/sair`, { idUsuario });
  }

  removerMembro(idSala: string, idUsuarioRemover: string, idUsuarioLogado: string): Observable<void> {
    return this.apiDelete.excluir(
      `${this.API_URL}/${idSala}/membros/${idUsuarioRemover}`,
      { idUsuarioLogado }
    );
  }
}
