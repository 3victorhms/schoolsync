import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { defer, map, Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class ApiDeleteService {

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  excluir(url: string, params: Record<string, string> = {}): Observable<void> {
    if (!Capacitor.isNativePlatform()) {
      return this.http.delete<void>(url, { params });
    }

    const token = this.tokenService.buscar();
    const headers: Record<string, string> = {
      Accept: 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return defer(() => CapacitorHttp.delete({
      url,
      params,
      headers,
      connectTimeout: 30000,
      readTimeout: 30000
    })).pipe(
      map(resposta => {
        if (resposta.status < 200 || resposta.status >= 300) {
          throw new HttpErrorResponse({
            status: resposta.status,
            statusText: `Falha ao excluir (${resposta.status})`,
            url,
            error: resposta.data
          });
        }

        return undefined;
      })
    );
  }
}
