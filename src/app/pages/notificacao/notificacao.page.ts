import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, checkmarkCircleOutline, checkmarkDoneOutline, notificationsOutline, peopleOutline, settingsOutline } from 'ionicons/icons';
import { NotificacaoModel } from '../../model/notificacao.model';
import { NotificacaoService } from '../../services/notificacao.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notificacao',
  templateUrl: './notificacao.page.html',
  styleUrls: ['./notificacao.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, CommonModule, RouterLink]
})
export class NotificacaoPage {
  notificacoes: NotificacaoModel[] = [];
  carregando = true;
  erro = '';
  private notificacoesSubscription?: Subscription;

  constructor(private service: NotificacaoService, private router: Router) {
    addIcons({ bookOutline, checkmarkCircleOutline, checkmarkDoneOutline, notificationsOutline, peopleOutline, settingsOutline });
  }

  ionViewWillEnter(): void {
    this.carregarNotificacoes();
    this.service.conectar();
    this.notificacoesSubscription?.unsubscribe();
    this.notificacoesSubscription = this.service.notificacoes$.subscribe(notificacoes => this.notificacoes = notificacoes);
  }

  carregarNotificacoes(event?: any): void {
    this.carregando = true;
    this.erro = '';
    this.service.listar().subscribe({
      next: notificacoes => { this.notificacoes = notificacoes; this.carregando = false; event?.target.complete(); },
      error: () => { this.notificacoes = []; this.carregando = false; this.erro = 'Não foi possível carregar as notificações. Tente novamente.'; event?.target.complete(); }
    });
  }

  atualizar(event: any): void {
    this.carregarNotificacoes(event);
  }

  ionViewWillLeave(): void {
    this.notificacoesSubscription?.unsubscribe();
  }

  marcarTodas(): void {
    if (this.notificacoes.every(item => item.lido)) return;
    this.erro = '';
    this.service.marcarTodasComoLidas().subscribe({
      error: () => this.erro = 'Não foi possível marcar as notificações como lidas.'
    });
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

  formatarHorario(valor: string): string {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(data);
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
