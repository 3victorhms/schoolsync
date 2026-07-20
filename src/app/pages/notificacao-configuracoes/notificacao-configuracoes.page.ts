import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonToggle, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkmarkOutline, notificationsOutline, phonePortraitOutline, timeOutline } from 'ionicons/icons';
import { ConfiguracaoNotificacao, NotificacaoService } from '../../services/notificacao.service';

@Component({
  selector: 'app-notificacao-configuracoes',
  templateUrl: './notificacao-configuracoes.page.html',
  styleUrls: ['./notificacao-configuracoes.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon, IonToggle]
})
export class NotificacaoConfiguracoesPage {
  configuracao: ConfiguracaoNotificacao = { noAplicativo: true, push: false, lembreteDias: 1 };
  salvando = false;

  constructor(private service: NotificacaoService, private toastController: ToastController) {
    addIcons({ arrowBackOutline, checkmarkOutline, notificationsOutline, phonePortraitOutline, timeOutline });
  }

  ionViewWillEnter(): void {
    this.service.buscarConfiguracao().subscribe({
      next: configuracao => this.configuracao = configuracao,
      error: () => undefined
    });
  }

  async salvar(): Promise<void> {
    if (this.salvando) return;
    this.salvando = true;
    this.service.salvarConfiguracao(this.configuracao).subscribe({
      next: async configuracao => {
        this.configuracao = configuracao;
        this.salvando = false;
        await this.exibirMensagem('Configurações salvas');
      },
      error: async () => {
        this.salvando = false;
        await this.exibirMensagem('Não foi possível salvar as configurações');
      }
    });
  }

  private async exibirMensagem(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 1800, position: 'top' });
    await toast.present();
  }
}
