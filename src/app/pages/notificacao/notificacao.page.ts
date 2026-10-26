import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, checkmarkCircleOutline, checkmarkDoneOutline, notificationsOutline, peopleOutline, settingsOutline } from 'ionicons/icons';
import { NotificacaoModel } from '../../model/notificacao.model';
import { NotificacaoService } from '../../services/notificacao.service';
import { Subscription } from 'rxjs';
import { rotaDaNotificacao } from '../../utils/notificacao-rota.util';

/** Bloco da lista ("Hoje", "Ontem"...). */
interface GrupoNotificacoes {
  chave: string;
  titulo: string;
  itens: NotificacaoModel[];
}

@Component({
  selector: 'app-notificacao',
  templateUrl: './notificacao.page.html',
  styleUrls: ['./notificacao.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, CommonModule, RouterLink]
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
      next: pagina => { this.notificacoes = pagina.itens; this.carregando = false; event?.target.complete(); },
      error: () => { this.notificacoes = []; this.carregando = false; this.erro = 'Não foi possível carregar as notificações. Tente novamente.'; event?.target.complete(); }
    });
  }

  atualizar(event: any): void {
    this.carregarNotificacoes(event);
  }

  // feito com auxílio do Claude: rolagem infinita, 20 notificações por vez
  get temMais(): boolean {
    return this.service.temMais;
  }

  carregarMais(event: any): void {
    this.service.carregarMais().subscribe({
      next: () => event?.target.complete(),
      error: () => {
        event?.target.complete();
        this.erro = 'Não foi possível carregar mais notificações. Puxe para atualizar.';
      }
    });
  }

  ionViewWillLeave(): void {
    this.notificacoesSubscription?.unsubscribe();
  }

  marcarTodas(): void {
    if (this.naoLidas === 0) return;
    this.erro = '';
    this.service.marcarTodasComoLidas().subscribe({
      error: () => this.erro = 'Não foi possível marcar as notificações como lidas.'
    });
  }

  abrir(notificacao: NotificacaoModel): void {
    const navegar = () => {
      const rota = rotaDaNotificacao(notificacao.tipo, notificacao.targetId);
      if (rota) this.router.navigate(rota);
    };
    if (notificacao.lido) navegar();
    else this.service.marcarComoLida(notificacao.id).subscribe({ next: navegar, error: navegar });
  }

  icone(tipo: string): string {
    const valor = tipo?.toUpperCase() || '';
    // tarefa ou grupo concluído vem antes do "GRUPO" pra ganhar o ícone de concluído
    if (valor.includes('CONCLUID')) return 'checkmark-circle-outline';
    if (valor.includes('GRUPO') || valor.includes('CONVITE') || valor.includes('SALA')) return 'people-outline';
    return 'book-outline';
  }

  get naoLidas(): number {
    return this.service.quantidadeNaoLidas;
  }

  // feito com auxílio do Claude: separa por dia (mais nova primeiro), igual app de mensagens
  get grupos(): GrupoNotificacoes[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const grupos: GrupoNotificacoes[] = [
      { chave: 'hoje', titulo: 'Hoje', itens: [] },
      { chave: 'ontem', titulo: 'Ontem', itens: [] },
      { chave: 'semana', titulo: 'Esta semana', itens: [] },
      { chave: 'antigas', titulo: 'Mais antigas', itens: [] },
    ];

    const ordenadas = [...this.notificacoes].sort((a, b) => this.tempo(b.horario) - this.tempo(a.horario));
    for (const notificacao of ordenadas) {
      const data = new Date(notificacao.horario);
      data.setHours(0, 0, 0, 0);
      const diasAtras = Math.round((hoje.getTime() - data.getTime()) / 86400000);

      if (Number.isNaN(diasAtras) || diasAtras > 6) grupos[3].itens.push(notificacao);
      else if (diasAtras <= 0) grupos[0].itens.push(notificacao);
      else if (diasAtras === 1) grupos[1].itens.push(notificacao);
      else grupos[2].itens.push(notificacao);
    }

    return grupos.filter(grupo => grupo.itens.length > 0);
  }

  private tempo(valor: string): number {
    const tempo = new Date(valor).getTime();
    return Number.isNaN(tempo) ? 0 : tempo;
  }

  /** Hoje e ontem mostram só a hora (o bloco já diz o dia); as outras mostram dia e hora. */
  formatarHorario(valor: string, chaveGrupo = ''): string {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    const soHora = chaveGrupo === 'hoje' || chaveGrupo === 'ontem';
    return new Intl.DateTimeFormat('pt-BR', soHora
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
    ).format(data);
  }

}
