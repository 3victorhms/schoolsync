import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotaModel, NotaRequest } from '../model/nota.model';
import { ApiDeleteService } from './api-delete.service';

/** Boletim pessoal: o usuário vem do token, então só aparecem as notas de quem está logado. */
@Injectable({
  providedIn: 'root',
})
export class NotaService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private apiDelete: ApiDeleteService) { }

  listarDaSala(idSala: string): Observable<NotaModel[]> {
    return this.http.get<NotaModel[]>(`${this.API_URL}/salas/${idSala}/notas`);
  }

  lancar(idSala: string, nota: NotaRequest): Observable<NotaModel> {
    return this.http.post<NotaModel>(`${this.API_URL}/salas/${idSala}/notas`, nota);
  }

  atualizar(idNota: string, nota: NotaRequest): Observable<NotaModel> {
    return this.http.put<NotaModel>(`${this.API_URL}/notas/${idNota}`, nota);
  }

  excluir(idNota: string): Observable<void> {
    return this.apiDelete.excluir(`${this.API_URL}/notas/${idNota}`);
  }
}
