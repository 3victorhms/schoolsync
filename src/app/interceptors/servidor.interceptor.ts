import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { falhaDeRede } from '../utils/conexao.util';
import { environment } from 'src/environments/environment';
import { requisicaoIniciada, requisicaoTerminada } from '../utils/servidor-lento.util';

// conta as requisições em andamento pro aviso de servidor acordando (servidor-lento.util.ts)
// e manda pra tela de manutenção quando a API responde 503 com "manutencao": true
export const servidorInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }
  const router = inject(Router);
  requisicaoIniciada();
  return next(request).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && erro.status === 0) falhaDeRede();
      if (erro instanceof HttpErrorResponse && erro.status === 503 && erro.error?.manutencao && !router.url.startsWith('/manutencao')) {
        router.navigate(['/manutencao'], { replaceUrl: true });
      }
      return throwError(() => erro);
    }),
    finalize(() => requisicaoTerminada())
  );
};
