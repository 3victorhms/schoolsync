import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { ComentarioModel } from 'src/app/model/comentario.model';
import { ComentarioService } from 'src/app/services/comentario.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { addIcons } from 'ionicons';
import {
  createOutline,
  calendarOutline,
  peopleOutline,
  starOutline,
  timeOutline,
  checkmarkCircleOutline,
  trashOutline,
  addOutline,
  chatboxOutline,
  lockClosedOutline,
  alertCircleOutline,
  ellipseOutline,
  bookmarkOutline,
  triangleOutline,
  sendOutline,
  returnDownBackOutline,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-atividade',
  templateUrl: './atividade.page.html',
  styleUrls: ['./atividade.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonButton,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class AtividadePage implements OnInit {

  atividade: AtividadeModel;
  usuario: UsuarioModel;
  criadorNome: string = '';
  comentarios: ComentarioModel[] = [];
  novoComentario: string = '';
  comentarioRespondendo: ComentarioModel | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private toastController: ToastController,
    private alertController: AlertController,
    private atividadeService: AtividadeService,
    private usuarioService: UsuarioService,
    private comentarioService: ComentarioService
  ) {
    this.atividade = new AtividadeModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    addIcons({
      createOutline,
      calendarOutline,
      peopleOutline,
      starOutline,
      timeOutline,
      checkmarkCircleOutline,
      trashOutline,
      addOutline,
      chatboxOutline,
      lockClosedOutline,
      alertCircleOutline,
      ellipseOutline,
      bookmarkOutline,
      triangleOutline,
      sendOutline,
      returnDownBackOutline,
      closeOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (id) {
      this.carregarAtividade(id);
    }
  }

  carregarAtividade(id: string) {
    this.atividadeService.buscarPorId(id, this.usuario.id).subscribe({
      next: (res) => {
        this.atividade = res;
        this.novoComentario = '';
        this.comentarioRespondendo = null;
        this.carregarCriador();
        this.carregarComentarios();
      },
      error: () => {
        this.exibirMensagem('Atividade não encontrada');
        this.navController.navigateBack('/salas');
      }
    });
  }

  carregarComentarios() {
    if (!this.atividade.id) {
      this.comentarios = [];
      return;
    }

    this.comentarioService.listarPorAtividade(this.atividade.id).subscribe({
      next: (res) => {
        this.comentarios = res || [];
      },
      error: () => {
        this.comentarios = [];
      }
    });
  }

  enviarComentario() {
    const texto = this.novoComentario.trim();

    if (!texto) return;

    this.comentarioService.criar(
      this.atividade.id,
      texto,
      this.usuario.id,
      this.comentarioRespondendo?.id
    ).subscribe({
      next: () => {
        this.novoComentario = '';
        this.comentarioRespondendo = null;
        this.carregarComentarios();
      },
      error: () => {
        this.exibirMensagem('Erro ao enviar comentario.');
      }
    });
  }

  responderComentario(comentario: ComentarioModel) {
    this.comentarioRespondendo = comentario;
  }

  cancelarResposta() {
    this.comentarioRespondendo = null;
  }

  async excluirComentario(comentario: ComentarioModel) {
    const alert = await this.alertController.create({
      header: 'Excluir comentario',
      message: 'Tem certeza que deseja excluir este comentario?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.comentarioService.excluir(comentario.id, this.usuario.id).subscribe({
              next: () => {
                this.carregarComentarios();
                this.exibirMensagem('Comentario excluido.');
              },
              error: () => {
                this.exibirMensagem('Erro ao excluir comentario.');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  podeAlterarComentario(comentario: ComentarioModel): boolean {
    return comentario.idUsuario === this.usuario.id;
  }

  iniciaisComentario(nome: string): string {
    if (!nome) return '?';

    return nome.split(' ')
      .slice(0, 2)
      .map(parte => parte[0]?.toUpperCase())
      .join('');
  }

  formatarDataComentario(data: string): string {
    if (!data) return '';

    const dataComentario = new Date(data);

    if (Number.isNaN(dataComentario.getTime())) return '';

    const dia = String(dataComentario.getDate()).padStart(2, '0');
    const mes = String(dataComentario.getMonth() + 1).padStart(2, '0');
    const hora = String(dataComentario.getHours()).padStart(2, '0');
    const minuto = String(dataComentario.getMinutes()).padStart(2, '0');

    return `${dia}/${mes} ${hora}:${minuto}`;
  }

  editar() {
    this.navController.navigateForward('/add-atividade-editar/' + this.atividade.id);
  }

  async excluir() {
    const alert = await this.alertController.create({
      header: 'Excluir atividade',
      message: 'Tem certeza que deseja excluir esta atividade?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.atividadeService.excluir(this.atividade.id).subscribe({
              next: () => {
                this.exibirMensagem('Atividade excluída.');
                this.navController.navigateBack('/sala/' + this.atividade.idSala);
              },
              error: () => {
                this.exibirMensagem('Erro ao excluir atividade.');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  carregarCriador() {
    if (!this.atividade.idCriador) {
      this.criadorNome = 'Desconhecido';
      return;
    }

    this.usuarioService.buscarPorId(this.atividade.idCriador)
      .subscribe({
        next: (criador) => {
          this.criadorNome = criador.nome || 'Desconhecido';
        },
        error: () => {
          this.criadorNome = 'Desconhecido';
        }
      });
  }

  get prazoEncerrado(): boolean {
    if (!this.atividade.dataEntrega) return false;

    const hoje = new Date().toISOString().split('T')[0];

    return this.atividade.dataEntrega < hoje;
  }

  get statusAtual(): string {
    return this.atividade.status || 'nao_iniciada';
  }

  get statusPrazo(): string {
    if (this.prazoEncerrado) return 'expirada';
    if (!this.atividade.estaNoCaderno) return 'fora_caderno';
    if (this.statusAtual === 'concluido') return 'concluido';
    if (this.statusAtual === 'nao_iniciada') return 'naoiniciada';

    return 'andamento';
  }

  get labelPrazo(): string {
    if (this.prazoEncerrado) return 'Expirada';
    if (!this.atividade.estaNoCaderno) return 'Não está no caderno';
    if (this.statusAtual === 'concluido') return 'Concluído';
    if (this.statusAtual === 'nao_iniciada') return 'Não iniciada';

    return 'Em andamento';
  }

  get iconePrazo(): string {
    if (this.prazoEncerrado) return 'lock-closed-outline';
    if (!this.atividade.estaNoCaderno) return 'bookmark-outline';
    if (this.statusAtual === 'concluido') return 'checkmark-circle-outline';
    if (this.statusAtual === 'nao_iniciada') return 'ellipse-outline';

    return 'time-outline';
  }

  alterarStatus(novoStatus: string) {
    if (this.prazoEncerrado || !this.atividade.estaNoCaderno) return;

    this.atividadeService.alterarStatus(
      this.atividade.id,
      this.usuario.id,
      novoStatus
    ).subscribe({
      next: () => {
        this.atividade.status = novoStatus;
        this.exibirMensagem('Status atualizado.');
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar status.');
      }
    });
  }

  adicionarNoCaderno() {
    this.atividadeService.adicionarNoCaderno(
      this.atividade.id,
      this.usuario.id
    ).subscribe({
      next: () => {
        this.atividade.estaNoCaderno = true;
        this.atividade.status = 'nao_iniciada';
        this.exibirMensagem('Atividade adicionada ao caderno!');
      },
      error: () => {
        this.exibirMensagem('Erro ao adicionar no caderno.');
      }
    });
  }

  removerDoCaderno() {
    this.atividadeService.removerDoCaderno(
      this.atividade.id,
      this.usuario.id
    ).subscribe({
      next: () => {
        this.atividade.estaNoCaderno = false;
        this.atividade.status = null;
        this.exibirMensagem('Atividade removida do caderno.');
      },
      error: () => {
        this.exibirMensagem('Erro ao remover do caderno.');
      }
    });
  }

  formatarData(data: string): string {
    if (!data) return '';

    const [ano, mes, dia] = data.split('-');

    const meses = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'
    ];

    return `${dia} de ${meses[parseInt(mes) - 1]}, ${ano}`;
  }

  labelPontos(valor: number | string): string {
    const pontos = Number(valor);
    return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });

    toast.present();
  }
}
