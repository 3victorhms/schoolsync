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
import { addIcons } from 'ionicons';
import { notificationsOutline, chevronBackOutline, chevronForwardOutline, peopleOutline, documentsOutline, calendarOutline, starOutline, homeOutline, businessOutline, trophyOutline, personOutline, pencilOutline } from 'ionicons/icons';

interface DiaCalendario {
  numero: number;
  data: Date;
  mesAtual: boolean;
  hoje: boolean;
  selecionado: boolean;
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

  private meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  constructor(
    private usuarioService: UsuarioService,
    private salaService: SalaService,
    private atividadeService: AtividadeService
  ) {
    this.usuario = this.usuarioService.buscarAutenticacao();
    addIcons({ notificationsOutline, chevronBackOutline, chevronForwardOutline, peopleOutline, documentsOutline, calendarOutline, starOutline, homeOutline, businessOutline, trophyOutline, personOutline, pencilOutline });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.gerarCalendario();
    this.carregarUltimaSala();
    this.carregarAtividadesDoDia();
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
    const todas = this.atividadeService.listar();
    const dataStr = this.dataSelecionada.toISOString().split('T')[0];
    this.atividadesDoDia = todas.filter(a => a.dataEntrega === dataStr);
  }

  carregarUltimaSala() {
    const id = localStorage.getItem('ultimaSala');
    if (id) {
      this.salaService.buscarPorId(id).subscribe(sala => {
        this.ultimaSala = sala || null;
      });
    }
  }
}