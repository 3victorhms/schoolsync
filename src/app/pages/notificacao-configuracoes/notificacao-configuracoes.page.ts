import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToggle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, notificationsOutline, phonePortraitOutline, timeOutline } from 'ionicons/icons';
import { ConfiguracaoNotificacao, NotificacaoService } from '../../services/notificacao.service';
import { NotificacaoPushService } from '../../services/notificacao-push.service';
import { firstValueFrom } from 'rxjs';
import { mostrarAviso } from 'src/app/utils/aviso.util';

@Component({
  selector: 'app-notificacao-configuracoes',
  templateUrl: './notificacao-configuracoes.page.html',
  styleUrls: ['./notificacao-configuracoes.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToggle, IonToolbar]
})
export class NotificacaoConfiguracoesPage {
  configuracao: ConfiguracaoNotificacao = { noAplicativo: true, push: false, lembreteDias: 1 };
  salvando = false;
  testandoPush = false;
  // o teste só aparece com o push salvo como ligado
  pushSalvo = false;

  constructor(
    private service: NotificacaoService,
    private notificacaoPushService: NotificacaoPushService,
    private toastController: ToastController
  ) {
    addIcons({ checkmarkOutline, notificationsOutline, phonePortraitOutline, timeOutline });
  }

  // espera carregar antes de deixar salvar, senão dava pra salvar os valores padrão por cima
  carregando = true;
  erroCarregar = false;

  ionViewWillEnter(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erroCarregar = false;
    this.service.buscarConfiguracao().subscribe({
      next: configuracao => { this.configuracao = configuracao; this.pushSalvo = !!configuracao.push; this.carregando = false; },
      error: () => { this.carregando = false; this.erroCarregar = true; }
    });
  }

  async testarPush(): Promise<void> {
    if (this.testandoPush) return;
    this.testandoPush = true;
    try {
      await this.notificacaoPushService.testar();
      mostrarAviso('Notificação de teste enviada. Ela deve chegar em instantes.', 5000);
    } catch (erro: any) {
      mostrarAviso(erro?.message || 'Não foi possível enviar a notificação de teste.', 6000);
    } finally {
      this.testandoPush = false;
    }
  }

  async salvar(): Promise<void> {
    if (this.salvando || this.carregando || this.erroCarregar) return;
    this.salvando = true;
    try {
      if (this.configuracao.push) {
        await this.notificacaoPushService.ativar();
      }

      this.configuracao = await firstValueFrom(this.service.salvarConfiguracao(this.configuracao));
      this.pushSalvo = !!this.configuracao.push;
      if (!this.configuracao.push) {
        await this.notificacaoPushService.desregistrar().catch(() => undefined);
      }
      await this.exibirMensagem('Configurações salvas');
    } catch (erro: any) {
      await this.exibirMensagem(erro?.message || 'Não foi possível salvar as configurações');
    } finally {
      this.salvando = false;
    }
  }

  private exibirMensagem(message: string): void {
    mostrarAviso(message);
  }
}
