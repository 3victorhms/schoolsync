import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).buscar();

  if (!token || !request.url.startsWith('http://localhost:8080')) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
