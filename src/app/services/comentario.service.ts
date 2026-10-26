import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComentarioModel } from '../model/comentario.model';
import { ApiDeleteService } from './api-delete.service';

/** Feito com auxílio do Claude: resposta paginada da API (ver Paginacao no backend). */
export interface PaginaComentarios {
  /** Comentários principais (com as respostas), do mais antigo para o mais novo. */
  itens: ComentarioModel[];
  /** Ainda há comentários mais antigos. */
  temMais: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  /** Os comentários mais recentes; com {@code antesDe}, os anteriores a esse horário. */
  listarPorAtividade(idAtividade: string, tamanho = 20, antesDe?: string): Observable<PaginaComentarios> {
    const params: Record<string, string | number> = { tamanho };
    if (antesDe) params['antesDe'] = antesDe;
    return this.http.get<PaginaComentarios>(
      `${this.API_URL}/atividades/${idAtividade}/comentarios`, { params }
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
