import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TemaService } from './services/tema.service';
import { NotificacaoPushService } from './services/notificacao-push.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private temaService: TemaService,
    private notificacaoPushService: NotificacaoPushService
  ) {
    this.temaService.aplicarTemaSalvo();
    void this.notificacaoPushService.inicializar().catch(erro =>
      console.warn('Não foi possível inicializar as notificações push.', erro)
    );
  }
}
