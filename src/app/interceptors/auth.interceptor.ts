import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { LoginService } from '../services/login.service';
import { environment } from 'src/environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).buscar();
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (!token || !request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  })).pipe(
    catchError((erro: HttpErrorResponse) => {
      // se a api recusar o token (expirou ou a conta foi desativada) volta pro login em qualquer tela,
      // em vez de cada página mostrar um erro diferente
      if (erro.status === 401 && !router.url.startsWith('/login')) {
        loginService.encerrarAutenticacao();
        router.navigate(['/login'], { queryParams: { motivo: 'sessao-expirada' } });
      }
      return throwError(() => erro);
    })
  );
};
