import { Component, OnInit } from '@angular/core';
import { ProgressoTarefasComponent, calcularProgresso } from 'src/app/components/progresso-tarefas/progresso-tarefas.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  ellipsisHorizontalOutline,
  ellipseOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  homeOutline,
  bookOutline,
  peopleOutline,
  personOutline,
  trashOutline,
  addOutline,
  calendarOutline
} from 'ionicons/icons';
import { GrupoModel } from 'src/app/model/grupo.model';
import { TarefaModel } from 'src/app/model/tarefa.model';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { GrupoService } from 'src/app/services/grupo.service';
import { TarefaService } from 'src/app/services/tarefa.service';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { finalize } from 'rxjs';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { classeUrgencia, rotuloUrgencia } from 'src/app/utils/urgencia.util';
import { formatarDataCurta } from 'src/app/utils/data.util';

@Component({
  selector: 'app-grupo-tarefas',
  templateUrl: './grupo-tarefas.page.html',
  styleUrls: ['./grupo-tarefas.page.scss'],
  standalone: true,
  imports: [
    ProgressoTarefasComponent,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonTabBar,
    IonTabButton,
    IonLabel,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class GrupoTarefasPage implements OnInit {

  grupo: GrupoModel;
  tarefas: TarefaModel[];
  atividades: AtividadeModel[];
  usuario: UsuarioModel;
  idAtividadeSelecionada: string;
  idUsuarioAtribuido: string;
  tituloTarefa: string;
  // prazo opcional da tarefa ("AAAA-MM-DD")
  prazoTarefa = '';
  tarefaExcluindoId = '';
  criandoTarefa = false;
  carregando = true;
  private pendentesCarregamento = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private grupoService: GrupoService,
    private tarefaService: TarefaService,
    private atividadeService: AtividadeService,
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private confirmacaoService: ConfirmacaoService
  ) {
    this.grupo = new GrupoModel();
    this.tarefas = [];
    this.atividades = [];
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.idAtividadeSelecionada = '';
    this.idUsuarioAtribuido = '';
    this.tituloTarefa = '';

    addIcons({
      ellipsisHorizontalOutline,
      ellipseOutline,
      checkmarkCircleOutline,
      lockClosedOutline,
      homeOutline,
      bookOutline,
      peopleOutline,
      personOutline,
      trashOutline,
      addOutline,
      calendarOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    const idGrupo = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (idGrupo && this.usuario.id) {
      this.pendentesCarregamento = 2;
      this.carregarGrupo(idGrupo);
      this.carregarTarefas(idGrupo);
    } else {
      this.carregando = false;
    }
  }

  atualizar(event: any) {
    const idGrupo = this.activatedRoute.snapshot.params['id'];
    if (idGrupo && this.usuario.id) {
      this.pendentesCarregamento = 2;
      this.carregarGrupo(idGrupo, event);
      this.carregarTarefas(idGrupo, event);
    } else {
      event?.target.complete();
    }
  }

  private finalizarCarregamento(event?: any) {
    this.pendentesCarregamento--;
    if (this.pendentesCarregamento <= 0) {
      this.carregando = false;
      event?.target.complete();
    }
  }

  carregarGrupo(idGrupo: string, event?: any) {
    this.grupoService.buscarPorId(idGrupo).pipe(
      finalize(() => this.finalizarCarregamento(event))
    ).subscribe({
      next: (res) => {
        this.grupo = res;
        this.carregarAtividades();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar grupo.');
      }
    });
  }

  carregarTarefas(idGrupo: string, event?: any) {
    this.tarefaService.listarPorGrupo(idGrupo).pipe(
      finalize(() => this.finalizarCarregamento(event))
    ).subscribe({
      next: (res) => {
        this.tarefas = res;
      },
      error: () => {
        this.tarefas = [];
      }
    });
  }

  carregarAtividades() {
    if (!this.grupo.idSala) {
      this.atividades = [];
      return;
    }

    this.atividadeService.listarPorSala(this.grupo.idSala).subscribe({
      next: (res) => {
        this.atividades = res;
      },
      error: () => {
        this.atividades = [];
      }
    });
  }

  criarTarefa() {
    if (this.criandoTarefa || !this.grupo.criador || !this.idAtividadeSelecionada || !this.idUsuarioAtribuido || !this.tituloTarefa.trim()) {
      return;
    }
    this.criandoTarefa = true;

    this.tarefaService.criar(
      this.grupo.id,
      this.tituloTarefa.trim(),
      this.idAtividadeSelecionada,
      this.idUsuarioAtribuido,
      this.prazoTarefa
    ).pipe(
      finalize(() => this.criandoTarefa = false)
    ).subscribe({
      next: () => {
        this.exibirMensagem('Tarefa criada.');
        this.idAtividadeSelecionada = '';
        this.idUsuarioAtribuido = '';
        this.tituloTarefa = '';
        this.prazoTarefa = '';
        this.carregarTarefas(this.grupo.id);
      },
      error: (erro) => {
        // ex.: prazo depois da entrega da atividade (a API explica o motivo)
        this.exibirMensagem(erro?.error?.message || 'Erro ao criar tarefa.');
      }
    });
  }

  alterarStatus(tarefa: TarefaModel) {
    if (!this.podeAlterar(tarefa)) {
      return;
    }

    const novoStatus = tarefa.status === 'concluido' ? 'pendente' : 'em_andamento';

    if (tarefa.status === 'em_andamento') {
      this.salvarStatus(tarefa, 'concluido');
      return;
    }

    this.salvarStatus(tarefa, novoStatus);
  }

  salvarStatus(tarefa: TarefaModel, status: string) {
    this.tarefaService.alterarStatus(tarefa.id, status).subscribe({
      next: (res) => {
        tarefa.status = res.status;
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar tarefa.');
      }
    });
  }

  async excluirTarefa(tarefa: TarefaModel) {
    if (this.tarefaExcluindoId) return;

    const confirmou = await this.confirmacaoService.confirmar(
      'Excluir tarefa',
      'Tem certeza que deseja excluir esta tarefa?',
      'Excluir'
    );

    if (!confirmou) return;

    this.tarefaExcluindoId = tarefa.id;
    this.tarefaService.excluir(tarefa.id).pipe(
      finalize(() => this.tarefaExcluindoId = '')
    ).subscribe({
      next: () => {
        this.tarefas = this.tarefas.filter(item => item.id !== tarefa.id);
        this.exibirMensagem('Tarefa excluída.');
      },
      error: (erro) => {
        console.error('Erro ao excluir tarefa:', erro);
        this.exibirMensagem(`Erro ao excluir tarefa (${erro?.status || 'sem conexão'}).`);
      }
    });
  }

  // hoje no formato do input de data (mínimo do prazo)
  get hojeIso(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  }

  // o prazo da tarefa vai no máximo até a entrega da atividade escolhida
  get prazoMaximo(): string {
    const atividade = this.atividades.find(item => item.id === this.idAtividadeSelecionada);
    return atividade?.dataEntrega?.split('T')[0] || '';
  }

  classePrazo(tarefa: TarefaModel): string {
    return classeUrgencia(tarefa.prazo, tarefa.status);
  }

  rotuloPrazo(tarefa: TarefaModel): string {
    if (!tarefa.prazo) return '';
    const rotulo = rotuloUrgencia(tarefa.prazo, tarefa.status);
    return rotulo ? `${formatarDataCurta(tarefa.prazo)} · ${rotulo}` : formatarDataCurta(tarefa.prazo);
  }

  // quantas tarefas já foram concluídas, no total e por membro (cartão no topo da lista)
  get progresso() {
    return calcularProgresso(this.tarefas);
  }

  iconeStatus(status: string): string {
    if (status === 'concluido') return 'checkmark-circle-outline';
    if (status === 'em_andamento') return 'ellipsis-horizontal-outline';
    return 'ellipse-outline';
  }

  labelStatus(status: string): string {
    if (status === 'concluido') return 'Concluida';
    if (status === 'em_andamento') return 'Em andamento';
    return 'Pendente';
  }

  podeAlterar(tarefa: TarefaModel): boolean {
    return tarefa.idUsuarioAtribuido === this.usuario.id;
  }

  exibirMensagem(texto: string): void {
    mostrarAviso(texto);
  }
}
