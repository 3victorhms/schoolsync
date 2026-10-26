import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EstadoManutencao {
  ativa: boolean;
  mensagem: string;
  previsao?: string | null;
  alteradoEm?: string | null;
  alteradoPor?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SistemaService {
  constructor(private http: HttpClient) { }

  // público: a tela de manutenção usa pra saber quando o app voltou
  status(): Observable<EstadoManutencao> {
    return this.http.get<EstadoManutencao>(`${environment.apiUrl}/sistema/status`);
  }
}
