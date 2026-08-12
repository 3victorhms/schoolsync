import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AtividadeModel } from '../model/atividade.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class AtividadeService {

  private readonly API_URL = 'https://schoolsync-api-kvfx.onrender.com/atividades';

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  salvar(atividade: AtividadeModel): Observable<AtividadeModel> {
    if (atividade.id) {
      return this.atualizar(atividade.id, atividade);
    }

    return this.http.post<AtividadeModel>(
      this.API_URL,
      atividade
    );
  }

  atualizar(id: string, atividade: AtividadeModel): Observable<AtividadeModel> {
    return this.http.put<AtividadeModel>(
      `${this.API_URL}/${id}`,
      atividade
    );
  }

  buscarPorId(id: string, idUsuarioLogado: string): Observable<AtividadeModel> {
    return this.http.get<AtividadeModel>(
      `${this.API_URL}/${id}?idUsuarioLogado=${idUsuarioLogado}`
    );
  }

  listarPorSala(idSala: string): Observable<AtividadeModel[]> {
    return this.http.get<AtividadeModel[]>(
      `${this.API_URL}/sala/${idSala}`
    );
  }

  listarPorUsuarioNoCaderno(idUsuario: string): Observable<AtividadeModel[]> {
    return this.http.get<AtividadeModel[]>(
      `${this.API_URL}/caderno/usuario/${idUsuario}`
    );
  }

  excluir(id: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/${id}`);
  }

  excluirAtividadesDaSala(idSala: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/sala/${idSala}`);
  }

  adicionarNoCaderno(idAtividade: string, idUsuario: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/${idAtividade}/caderno?idUsuario=${idUsuario}`,
      null
    );
  }

  removerDoCaderno(idAtividade: string, idUsuario: string): Observable<void> {
    return this.apiDelete.excluir(
      `${this.API_URL}/${idAtividade}/caderno`,
      { idUsuario }
    );
  }

  alterarStatus(idAtividade: string, idUsuario: string, status: string): Observable<void> {
    return this.http.put<void>(
      `${this.API_URL}/${idAtividade}/status?idUsuario=${idUsuario}&status=${status}`,
      null
    );
  }
}
