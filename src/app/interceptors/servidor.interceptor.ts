import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
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
  return next(request).pipe(finalize(() => requisicaoTerminada()));
};
