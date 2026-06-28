import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  ellipsisHorizontalOutline,
  ellipseOutline,
  checkmarkCircleOutline,
  homeOutline,
  businessOutline,
  book,
  personOutline,
  trashOutline
} from 'ionicons/icons';
import { GrupoModel } from 'src/app/model/grupo.model';
import { TarefaModel } from 'src/app/model/tarefa.model';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { GrupoService } from 'src/app/services/grupo.service';
import { TarefaService } from 'src/app/services/tarefa.service';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-grupo-tarefas',
  templateUrl: './grupo-tarefas.page.html',
  styleUrls: ['./grupo-tarefas.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private grupoService: GrupoService,
    private tarefaService: TarefaService,
    private atividadeService: AtividadeService,
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private alertController: AlertController
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
      homeOutline,
      businessOutline,
      book,
      personOutline,
      trashOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    const idGrupo = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (idGrupo && this.usuario.id) {
      this.carregarGrupo(idGrupo);
      this.carregarTarefas(idGrupo);
    }
  }

  carregarGrupo(idGrupo: string) {
    this.grupoService.buscarPorId(idGrupo, this.usuario.id).subscribe({
      next: (res) => {
        this.grupo = res;
        this.carregarAtividades();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar grupo.');
      }
    });
  }

  carregarTarefas(idGrupo: string) {
    this.tarefaService.listarPorGrupo(idGrupo, this.usuario.id).subscribe({
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
    if (!this.grupo.criador || !this.idAtividadeSelecionada || !this.idUsuarioAtribuido || !this.tituloTarefa.trim()) {
      return;
    }

    this.tarefaService.criar(
      this.grupo.id,
      this.tituloTarefa.trim(),
      this.idAtividadeSelecionada,
      this.idUsuarioAtribuido,
      this.usuario.id
    ).subscribe({
      next: () => {
        this.exibirMensagem('Tarefa criada.');
        this.idAtividadeSelecionada = '';
        this.idUsuarioAtribuido = '';
        this.tituloTarefa = '';
        this.carregarTarefas(this.grupo.id);
      },
      error: () => {
        this.exibirMensagem('Erro ao criar tarefa.');
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
    this.tarefaService.alterarStatus(tarefa.id, status, this.usuario.id).subscribe({
      next: (res) => {
        tarefa.status = res.status;
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar tarefa.');
      }
    });
  }

  async excluirTarefa(tarefa: TarefaModel) {
    const alert = await this.alertController.create({
      header: 'Excluir tarefa',
      message: 'Tem certeza que deseja excluir esta tarefa?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.tarefaService.excluir(tarefa.id, this.usuario.id).subscribe({
              next: () => {
                this.tarefas = this.tarefas.filter(item => item.id !== tarefa.id);
                this.exibirMensagem('Tarefa excluida.');
              },
              error: () => this.exibirMensagem('Erro ao excluir tarefa.')
            });
          }
        }
      ]
    });

    await alert.present();
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

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }
}
