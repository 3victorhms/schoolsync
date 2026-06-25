import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  triangleOutline
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
    CommonModule
  ]
})
export class AtividadePage implements OnInit {

  atividade: AtividadeModel;
  usuario: UsuarioModel;
  criadorNome: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private toastController: ToastController,
    private alertController: AlertController,
    private atividadeService: AtividadeService,
    private usuarioService: UsuarioService
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
      triangleOutline
    });
  }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.params['id'];

    if (id) {
      this.carregarAtividade(id);
    }
  }

  carregarAtividade(id: string) {
    this.atividadeService.buscarPorId(id, this.usuario.id).subscribe({
      next: (res) => {
        this.atividade = res;
        this.carregarCriador();
      },
      error: () => {
        this.exibirMensagem('Atividade não encontrada');
        this.navController.navigateBack('/salas');
      }
    });
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

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });

    toast.present();
  }
}