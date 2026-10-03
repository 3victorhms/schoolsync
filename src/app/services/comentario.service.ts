import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComentarioModel } from '../model/comentario.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  listarPorAtividade(idAtividade: string): Observable<ComentarioModel[]> {
    return this.http.get<ComentarioModel[]>(
      `${this.API_URL}/atividades/${idAtividade}/comentarios`
    );
  }

  criar(idAtividade: string, texto: string, idComentarioPai?: string | null): Observable<ComentarioModel> {
    return this.http.post<ComentarioModel>(
      `${this.API_URL}/atividades/${idAtividade}/comentarios`,
      { texto, idComentarioPai }
    );
  }

  atualizar(idComentario: string, texto: string): Observable<ComentarioModel> {
    return this.http.put<ComentarioModel>(
      `${this.API_URL}/comentarios/${idComentario}`,
      { texto }
    );
  }

  excluir(idComentario: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/comentarios/${idComentario}`);
  }
}
