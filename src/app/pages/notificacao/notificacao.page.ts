import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, checkmarkCircleOutline, closeOutline, notificationsOutline, peopleOutline, settingsOutline } from 'ionicons/icons';
import { NotificacaoModel } from '../../model/notificacao.model';
import { NotificacaoService } from '../../services/notificacao.service';

@Component({
  selector: 'app-notificacao',
  templateUrl: './notificacao.page.html',
  styleUrls: ['./notificacao.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, RouterLink]
})
export class NotificacaoPage {
  notificacoes: NotificacaoModel[] = [];
  carregando = true;

  constructor(private service: NotificacaoService, private router: Router) {
    addIcons({ bookOutline, checkmarkCircleOutline, closeOutline, notificationsOutline, peopleOutline, settingsOutline });
  }

  ionViewWillEnter(): void {
    this.service.listar().subscribe({
      next: notificacoes => { this.notificacoes = notificacoes; this.carregando = false; },
      error: () => { this.notificacoes = []; this.carregando = false; }
    });
    this.service.notificacoes$.subscribe(notificacoes => this.notificacoes = notificacoes);
  }

  marcarTodas(): void {
    if (this.notificacoes.every(item => item.lido)) return;
    this.service.marcarTodasComoLidas().subscribe();
  }

  abrir(notificacao: NotificacaoModel): void {
    const navegar = () => {
      const rota = this.rotaDaNotificacao(notificacao);
      if (rota) this.router.navigate(rota);
    };
    if (notificacao.lido) navegar();
    else this.service.marcarComoLida(notificacao.id).subscribe({ next: navegar, error: navegar });
  }

  icone(tipo: string): string {
    const valor = tipo?.toUpperCase();
    if (valor.includes('GRUPO') || valor.includes('CONVITE')) return 'people-outline';
    if (valor.includes('CONCLUID')) return 'checkmark-circle-outline';
    return 'book-outline';
  }

  private rotaDaNotificacao(notificacao: NotificacaoModel): string[] | null {
    if (!notificacao.targetId) return null;
    const tipo = notificacao.tipo?.toUpperCase();
    if (tipo.includes('GRUPO') || tipo.includes('CONVITE')) return ['/grupo', notificacao.targetId];
    if (tipo.includes('ATIVIDADE')) return ['/atividade', notificacao.targetId];
    if (tipo.includes('TAREFA')) return ['/tarefa'];
    return null;
  }
}
