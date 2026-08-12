import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComentarioModel } from '../model/comentario.model';
import { ApiDeleteService } from './api-delete.service';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {

  private readonly API_URL = 'https://schoolsync-api-kvfx.onrender.com';

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  listarPorAtividade(idAtividade: string): Observable<ComentarioModel[]> {
    return this.http.get<ComentarioModel[]>(
      `${this.API_URL}/atividades/${idAtividade}/comentarios`
    );
  }

  criar(idAtividade: string, texto: string, idUsuario: string, idComentarioPai?: string | null): Observable<ComentarioModel> {
    return this.http.post<ComentarioModel>(
      `${this.API_URL}/atividades/${idAtividade}/comentarios`,
      { texto, idUsuario, idComentarioPai }
    );
  }

  atualizar(idComentario: string, texto: string, idUsuario: string): Observable<ComentarioModel> {
    return this.http.put<ComentarioModel>(
      `${this.API_URL}/comentarios/${idComentario}`,
      { texto, idUsuario }
    );
  }

  excluir(idComentario: string, idUsuario: string): Observable<void> {
    return this.apiDelete.excluir(
      `${this.API_URL}/comentarios/${idComentario}`,
      { idUsuario }
    );
  }
}
