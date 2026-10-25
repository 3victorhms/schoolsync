import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonApp, IonMenu, IonRouterOutlet, IonSplitPane } from '@ionic/angular/standalone';
import { Subscription, filter } from 'rxjs';
import { TemaService } from './services/tema.service';
import { NotificacaoPushService } from './services/notificacao-push.service';
import { MenuLateralComponent } from './components/menu-lateral/menu-lateral.component';

// a partir dessa largura o app vira "versão web": menu lateral fixo no lugar da barra de abas
const MEDIA_TELA_LARGA = '(min-width: 992px)';
const ROTAS_SEM_MENU = ['/', '/login', '/add-usuario', '/recuperar-senha'];

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonSplitPane, IonMenu, IonRouterOutlet, MenuLateralComponent],
})
export class AppComponent implements OnDestroy {

  telaLarga = window.matchMedia(MEDIA_TELA_LARGA).matches;
  rotaComMenu = false;

  private readonly mediaTelaLarga = window.matchMedia(MEDIA_TELA_LARGA);
  private readonly aoMudarLargura = (evento: MediaQueryListEvent) => this.telaLarga = evento.matches;
  private navegacao: Subscription;

  constructor(
    private temaService: TemaService,
    private notificacaoPushService: NotificacaoPushService,
    router: Router
  ) {
    this.temaService.aplicarTemaSalvo();
    void this.notificacaoPushService.inicializar().catch(erro =>
      console.warn('Não foi possível inicializar as notificações push.', erro)
    );

    this.mediaTelaLarga.addEventListener('change', this.aoMudarLargura);

    // login e cadastro não têm menu (o usuário ainda não entrou)
    this.navegacao = router.events.pipe(filter(evento => evento instanceof NavigationEnd)).subscribe(evento => {
      const caminho = (evento as NavigationEnd).urlAfterRedirects.split('?')[0];
      this.rotaComMenu = !ROTAS_SEM_MENU.includes(caminho);
    });
  }

  get mostrarMenu(): boolean {
    return this.telaLarga && this.rotaComMenu;
  }

  ngOnDestroy(): void {
    this.mediaTelaLarga.removeEventListener('change', this.aoMudarLargura);
    this.navegacao.unsubscribe();
  }
}
