import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonCard, IonCardContent, IonTabBar, IonLabel } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { NotificacaoService } from 'src/app/services/notificacao.service';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { notificationsOutline, chevronBackOutline, chevronForwardOutline, peopleOutline, documentsOutline, calendarOutline, starOutline, homeOutline, businessOutline, book, personOutline, pencilOutline } from 'ionicons/icons';

interface DiaCalendario {
  numero: number;
  data: Date;
  mesAtual: boolean;
  hoje: boolean;
  selecionado: boolean;
  indicador?: 'concluida' | 'atrasada' | 'hoje' | 'proxima' | 'semana' | 'mes' | 'futuro';
  resumoAtividades?: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonIcon, IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar, IonTabBar, IonLabel, CommonModule, RouterLink]
})
export class InicioPage implements OnInit {

  usuario: UsuarioModel;
  ultimaSala: SalaModel | null = null;
  diasCalendario: DiaCalendario[] = [];
  atividadesDoDia: AtividadeModel[] = [];
  dataSelecionada: Date = new Date();
  mesAtual: string = '';
  dataAtual: Date = new Date();
  notificacoesNaoLidas = 0;
  atividadesCalendario: AtividadeModel[] = [];
  private notificacoesSubscription?: Subscription;

  private meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  constructor(
    private usuarioService: UsuarioService,
    private salaService: SalaService,
    private atividadeService: AtividadeService,
    private notificacaoService: NotificacaoService
  ) {
    this.usuario = this.usuarioService.buscarAutenticacao();
    addIcons({ notificationsOutline, chevronBackOutline, chevronForwardOutline, peopleOutline, documentsOutline, calendarOutline, starOutline, homeOutline, businessOutline, book, personOutline, pencilOutline });
  }

  ngOnInit() { }

  get primeiroNomeUsuario(): string {
    return (this.usuario.nome || '').trim().split(/\s+/)[0] || 'Estudante';
  }

  ionViewWillEnter() {
    this.carregarUltimaSala();
    this.carregarAtividadesCalendario();
    this.notificacaoService.listar().subscribe({ error: () => this.notificacoesNaoLidas = 0 });
    this.notificacaoService.conectar();
    this.notificacoesSubscription?.unsubscribe();
    this.notificacoesSubscription = this.notificacaoService.notificacoes$.subscribe(notificacoes => {
      this.notificacoesNaoLidas = notificacoes.filter(notificacao => !notificacao.lido).length;
    });
  }

  ionViewWillLeave() {
    this.notificacoesSubscription?.unsubscribe();
  }

  gerarCalendario() {
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();
    this.mesAtual = `${this.meses[mes]} ${ano}`;

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();

    this.diasCalendario = [];

    // dias do mês anterior
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = primeiroDia - 1; i >= 0; i--) {
      const data = new Date(ano, mes - 1, diasMesAnterior - i);
      this.diasCalendario.push({ numero: diasMesAnterior - i, data, mesAtual: false, hoje: false, selecionado: false });
    }

    // dias do mês atual
    for (let i = 1; i <= ultimoDia; i++) {
      const data = new Date(ano, mes, i);
      const ehHoje = data.toDateString() === hoje.toDateString();
      const selecionado = data.toDateString() === this.dataSelecionada.toDateString();
      this.diasCalendario.push({ numero: i, data, mesAtual: true, hoje: ehHoje, selecionado });
    }

    // dias do próximo mês
    const restante = 42 - this.diasCalendario.length;
    for (let i = 1; i <= restante; i++) {
      const data = new Date(ano, mes + 1, i);
      this.diasCalendario.push({ numero: i, data, mesAtual: false, hoje: false, selecionado: false });
    }

    this.atualizarIndicadoresCalendario();
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]}`;
  }

  selecionarDia(dia: DiaCalendario) {
    this.diasCalendario.forEach(d => d.selecionado = false);
    dia.selecionado = true;
    this.dataSelecionada = dia.data;
    this.carregarAtividadesDoDia();
  }

  mesAnterior() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.gerarCalendario();
  }

  proximoMes() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.gerarCalendario();
  }

  get dataSelecionadaLabel(): string {
    const d = this.dataSelecionada;
    return `${d.getDate()} de ${this.meses[d.getMonth()]}`;
  }

  carregarAtividadesDoDia() {
    if (!this.usuario.id) {
      this.atividadesDoDia = [];
      return;
    }

    const d = this.dataSelecionada;
    const dataStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    this.atividadesDoDia = this.atividadesCalendario.filter(a => a.dataEntrega === dataStr);
  }

  private carregarAtividadesCalendario() {
    if (!this.usuario.id) return;

    this.atividadeService.listarPorUsuarioNoCaderno(this.usuario.id).subscribe({
      next: atividades => {
        this.atividadesCalendario = atividades || [];
        this.gerarCalendario();
        this.carregarAtividadesDoDia();
      },
      error: () => {
        this.atividadesCalendario = [];
        this.gerarCalendario();
        this.carregarAtividadesDoDia();
      }
    });
  }

  private atualizarIndicadoresCalendario() {
    for (const dia of this.diasCalendario) {
      const data = this.dataParaChave(dia.data);
      const atividades = this.atividadesCalendario.filter(atividade => atividade.dataEntrega === data);
      if (!atividades.length) continue;

      dia.indicador = this.indicadorMaisUrgente(atividades);
      const pendentes = atividades.filter(atividade => atividade.status !== 'concluido').length;
      dia.resumoAtividades = `${atividades.length} atividade${atividades.length === 1 ? '' : 's'}: ${pendentes} pendente${pendentes === 1 ? '' : 's'} e ${atividades.length - pendentes} concluída${atividades.length - pendentes === 1 ? '' : 's'}`;
    }
  }

  private indicadorMaisUrgente(atividades: AtividadeModel[]): DiaCalendario['indicador'] {
    const pendentes = atividades.filter(atividade => atividade.status !== 'concluido');
    if (!pendentes.length) return 'concluida';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() + ((7 - hoje.getDay()) % 7));
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const prioridades = pendentes.map(atividade => {
      const [ano, mes, dia] = atividade.dataEntrega.split('-').map(Number);
      const prazo = new Date(ano, mes - 1, dia);
      const diferenca = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);
      if (diferenca < 0) return { ordem: 0, tipo: 'atrasada' as const };
      if (diferenca === 0) return { ordem: 1, tipo: 'hoje' as const };
      if (diferenca <= 3) return { ordem: 2, tipo: 'proxima' as const };
      if (prazo <= domingo) return { ordem: 3, tipo: 'semana' as const };
      if (prazo <= fimMes) return { ordem: 4, tipo: 'mes' as const };
      return { ordem: 5, tipo: 'futuro' as const };
    });

    return prioridades.sort((a, b) => a.ordem - b.ordem)[0].tipo;
  }

  private dataParaChave(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  get resumoDiaSelecionado(): string {
    return this.diasCalendario.find(dia => dia.selecionado)?.resumoAtividades || '';
  }

  carregarUltimaSala() {
    this.ultimaSala = null;

    if (!this.usuario.id) {
      return;
    }

    const id = localStorage.getItem(`ultimaSala:${this.usuario.id}`);
    if (id) {
      this.salaService.buscarPorId(id, this.usuario.id).subscribe({
        next: (sala) => {
          this.ultimaSala = sala || null;
        },
        error: () => {
          localStorage.removeItem(`ultimaSala:${this.usuario.id}`);
          this.ultimaSala = null;
        }
      });
    }
  }

  labelPontos(valor: number | string): string {
    const pontos = Number(valor);
    return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
  }
}
