import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { LoginService } from '../services/login.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const tokenService = inject(TokenService);
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (tokenService.estaValido()) {
    return true;
  }

  const motivo = tokenService.possuiToken() ? 'sessao-expirada' : 'login-necessario';
  loginService.encerrarAutenticacao();
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url, motivo }
  });
};
