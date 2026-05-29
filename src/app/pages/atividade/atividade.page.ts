import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { addIcons } from 'ionicons';
import { createOutline, trashBinOutline, calendarOutline, peopleOutline, starOutline, timeOutline, checkmarkCircleOutline, flashOutline, trashOutline, addOutline, chatboxOutline, lockClosedOutline, alertCircleOutline } from 'ionicons/icons';
import { SalaService } from 'src/app/services/sala.service';

@Component({
  selector: 'app-atividade',
  templateUrl: './atividade.page.html',
  styleUrls: ['./atividade.page.scss'],
  standalone: true,
  imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonButton, IonToolbar, CommonModule]
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
    private usuarioService: UsuarioService, private salaService: SalaService
  ) {
    this.atividade = new AtividadeModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    addIcons({ createOutline, trashBinOutline, calendarOutline, peopleOutline, starOutline, timeOutline, checkmarkCircleOutline, flashOutline, trashOutline, addOutline, chatboxOutline, lockClosedOutline, alertCircleOutline });
  }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.params['id'];
    console.log('id:', id);

    if (id) {
      this.atividadeService.buscarPorId(id).subscribe(res => {
        console.log('res:', res);
        if (!res) {
          this.exibirMensagem('Atividade não encontrada');
          this.navController.navigateBack('/salas');
          return;
        }
        this.atividade = res;
        if (!this.atividade.status) this.atividade.status = {};
        if (!this.atividade.noCaderno) this.atividade.noCaderno = [];
        this.carregarCriador();
      });
    }
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
            this.atividadeService.excluir(this.atividade.id);
            this.salaService.excluirAtividade(this.atividade);
            this.exibirMensagem('Atividade excluída.');
            this.navController.navigateBack('/sala/' + this.atividade.idSala);
          }
        }
      ]
    });
    await alert.present();
  }

  carregarCriador() {
    const criador = this.usuarioService.buscarPorId(this.atividade.criadaPor);
    this.criadorNome = criador?.nome || 'Desconhecido';
  }

  get prazoEncerrado(): boolean {
    if (!this.atividade.dataEntrega) return false;
    const hoje = new Date().toISOString().split('T')[0];
    return this.atividade.dataEntrega < hoje;
  }

  get statusAtual(): string {
    return this.atividade.status?.[this.usuario.id] || 'em_andamento';
  }

  get statusPrazo(): string {
    if (this.prazoEncerrado) return 'expirada';
    if (this.statusAtual === 'concluido') return 'concluido';
    return 'andamento';
  }

  get labelPrazo(): string {
    if (this.prazoEncerrado) return 'Expirada';
    if (this.statusAtual === 'concluido') return 'Concluído';
    return 'Em andamento';
  }

  get iconePrazo(): string {
    if (this.prazoEncerrado) return 'lock-closed-outline';
    if (this.statusAtual === 'concluido') return 'checkmark-circle-outline';
    return 'time-outline';
  }

  alterarStatus(novoStatus: string) {
    if (this.prazoEncerrado || !this.estaNoCaderno) return;
    this.atividade.status[this.usuario.id] = novoStatus;
    this.atividadeService.salvar(this.atividade).subscribe();
    this.salaService.sincronizarAtividade(this.atividade);
  }

  get estaNoCaderno(): boolean {
    return this.atividade.noCaderno.some(u => u.id === this.usuario.id);
  }

  adicionarNoCaderno() {
    this.atividade.noCaderno.push(this.usuario);
    this.atividadeService.salvar(this.atividade).subscribe({
      next: () => this.exibirMensagem('Atividade adicionada ao caderno!'),
      error: () => this.exibirMensagem('Erro ao adicionar no caderno.')
    });
  }

  removerDoCaderno() {
    this.atividade.noCaderno = this.atividade.noCaderno.filter(u => u.id !== this.usuario.id);
    this.atividadeService.salvar(this.atividade).subscribe({
      next: () => this.exibirMensagem('Atividade removida do caderno.'),
      error: () => this.exibirMensagem('Erro ao remover do caderno.')
    });
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
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