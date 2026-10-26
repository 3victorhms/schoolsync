import { bootstrapApplication } from '@angular/platform-browser';
import { inject, provideAppInitializer } from '@angular/core';
import { RouteReuseStrategy, TitleStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { servidorInterceptor } from './app/interceptors/servidor.interceptor';
import { TituloPaginaService } from './app/services/titulo-pagina.service';
import { TokenService } from './app/services/token.service';
import { iniciarMonitorConexao } from './app/utils/conexao.util';

iniciarMonitorConexao();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(withInterceptors([servidorInterceptor, authInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: TitleStrategy, useExisting: TituloPaginaService },
    // carrega o token salvo (Preferences) antes da primeira tela: o guard precisa dele
    provideAppInitializer(() => inject(TokenService).inicializar()),
  ],
});
