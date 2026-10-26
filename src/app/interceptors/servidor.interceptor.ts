import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, finalize, throwError } from 'rxjs';
import { falhaDeRede } from '../utils/conexao.util';
import { environment } from 'src/environments/environment';
import { requisicaoIniciada, requisicaoTerminada } from '../utils/servidor-lento.util';

/**
 * Feito com auxílio do Claude: conta as requisições à API em andamento para o
 * aviso de "servidor acordando" (ver servidor-lento.util.ts).
 */
export const servidorInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }
  requisicaoIniciada();
  return next(request).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && erro.status === 0) falhaDeRede();
      return throwError(() => erro);
    }),
    finalize(() => requisicaoTerminada())
  );
};
