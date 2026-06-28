import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonTabBar,
  IonLabel,
  IonTabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  timeOutline,
  checkmarkCircleOutline,
  calendarOutline,
  starOutline,
  homeOutline,
  businessOutline,
  book,
  personOutline,
  ellipseOutline,
  searchOutline,
  closeOutline
} from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { TarefaModel } from 'src/app/model/tarefa.model';
import { TarefaService } from 'src/app/services/tarefa.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-caderno',
  templateUrl: './caderno.page.html',
  styleUrls: ['./caderno.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonTabBar,
    IonTabButton,
    IonLabel,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class CadernoPage implements OnInit {

  usuario: UsuarioModel;
  atividades: AtividadeModel[];
  atividadesFiltradas: AtividadeModel[];
  tarefas: TarefaModel[];
  tarefasFiltradas: TarefaModel[];
  filtroAtivo: string;
  termoBusca: string;

  constructor(
    private usuarioService: UsuarioService,
    private atividadeService: AtividadeService,
    private tarefaService: TarefaService
  ) {
    this.usuario = new UsuarioModel();
    this.atividades = [];
    this.atividadesFiltradas = [];
    this.tarefas = [];
    this.tarefasFiltradas = [];
    this.filtroAtivo = 'todas';
    this.termoBusca = '';

    addIcons({
      bookOutline,
      timeOutline,
      checkmarkCircleOutline,
      calendarOutline,
      starOutline,
      homeOutline,
      businessOutline,
      book,
      personOutline,
      ellipseOutline,
      searchOutline,
      closeOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregarCaderno();
  }

  carregarCaderno() {
    if (!this.usuario.id) {
      this.atividades = [];
      this.atividadesFiltradas = [];
      this.tarefas = [];
      this.tarefasFiltradas = [];
      this.termoBusca = '';
      return;
    }

    this.atividadeService.listarPorUsuarioNoCaderno(this.usuario.id).subscribe({
      next: (res) => {
        this.atividades = res;
        this.aplicarFiltros();
      },
      error: () => {
        this.atividades = [];
        this.atividadesFiltradas = [];
      }
    });

    this.tarefaService.listarPorUsuario(this.usuario.id).subscribe({
      next: (res) => {
        this.tarefas = res || [];
        this.aplicarFiltros();
      },
      error: () => {
        this.tarefas = [];
        this.tarefasFiltradas = [];
      }
    });
  }

  filtrar(filtro: string) {
    this.filtroAtivo = filtro;
    this.aplicarFiltros();
  }

  buscar() {
    this.aplicarFiltros();
  }

  limparBusca() {
    this.termoBusca = '';
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    const termo = this.normalizarTexto(this.termoBusca);

    this.atividadesFiltradas = this.atividades.filter(atividade => {
      const bateStatus = this.filtroAtivo === 'todas' || atividade.status === this.filtroAtivo;
      const bateBusca = !termo || this.textoBuscaAtividade(atividade).includes(termo);

      return bateStatus && bateBusca;
    });

    this.tarefasFiltradas = this.tarefas.filter(tarefa => {
      const bateStatus = this.filtroAtivo === 'todas' || this.statusNormalizadoTarefa(tarefa.status) === this.filtroAtivo;
      const bateBusca = !termo || this.textoBuscaTarefa(tarefa).includes(termo);

      return bateStatus && bateBusca;
    });
  }

  textoBuscaAtividade(atividade: AtividadeModel): string {
    return this.normalizarTexto([
      atividade.titulo,
      atividade.descricao,
      atividade.disciplina,
      atividade.valor?.toString(),
      this.formatarData(atividade.dataEntrega),
      atividade.dataEntrega
    ].join(' '));
  }

  textoBuscaTarefa(tarefa: TarefaModel): string {
    return this.normalizarTexto([
      tarefa.titulo,
      tarefa.status,
      tarefa.tituloAtividade,
      tarefa.disciplinaAtividade,
      tarefa.nomeUsuarioAtribuido,
      tarefa.nomeCriador,
      this.formatarData(tarefa.dataCriacao),
      tarefa.dataCriacao
    ].join(' '));
  }

  statusNormalizadoTarefa(status: string | null): string {
    if (!status || status === 'pendente') return 'nao_iniciada';
    return status;
  }

  get temResultados(): boolean {
    return this.atividadesFiltradas.length > 0 || this.tarefasFiltradas.length > 0;
  }

  normalizarTexto(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  iconeStatus(status: string | null): string {
    switch (status) {
      case 'concluido':
        return 'checkmark-circle-outline';
      case 'nao_iniciada':
      case 'pendente':
      case null:
      case undefined:
        return 'ellipse-outline';
      default:
        return 'time-outline';
    }
  }

  labelStatus(status: string | null): string {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'nao_iniciada':
      case 'pendente':
      case null:
      case undefined:
        return 'Não iniciada';
      default:
        return 'Em andamento';
    }
  }

  classeStatus(status: string | null): string {
    return this.statusNormalizadoTarefa(status);
  }

  formatarData(data: string): string {
    if (!data) return '';

    const dataBase = data.includes('T') ? data.split('T')[0] : data;
    const [ano, mes, dia] = dataBase.split('-');

    if (!ano || !mes || !dia) return dataBase;

    return `${dia}/${mes}/${ano}`;
  }

  labelPontos(valor: number | string): string {
    const pontos = Number(valor);
    return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
  }
}
