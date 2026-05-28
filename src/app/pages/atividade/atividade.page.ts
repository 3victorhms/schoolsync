import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { addIcons } from 'ionicons';
import { calendarOutline, peopleOutline, starOutline, timeOutline, checkmarkCircleOutline, flashOutline, trashOutline, addOutline, chatboxOutline, lockClosedOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-atividade',
  templateUrl: './atividade.page.html',
  styleUrls: ['./atividade.page.scss'],
  standalone: true,
  imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule]
})
export class AtividadePage implements OnInit {

  atividade: AtividadeModel;
  usuario: UsuarioModel;
  criadorNome: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private toastController: ToastController,
    private atividadeService: AtividadeService,
    private usuarioService: UsuarioService
  ) {
    this.atividade = new AtividadeModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    addIcons({ calendarOutline, peopleOutline, starOutline, timeOutline, checkmarkCircleOutline, flashOutline, trashOutline, addOutline, chatboxOutline, lockClosedOutline, alertCircleOutline });
  }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.params['id'];

    if (id) {
      this.atividadeService.buscarPorId(id).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Atividade não encontrada');
          this.navController.navigateBack('/salas');
          return;
        }
        this.atividade = res;
        this.carregarCriador();
      });
    }
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

  get statusPrazo(): string {
    if (this.prazoEncerrado) return 'expirada';
    if (this.atividade.status === 'concluido') return 'concluido';
    return 'andamento';
  }

  get labelPrazo(): string {
    if (this.prazoEncerrado) return 'Expirada';
    if (this.atividade.status === 'concluido') return 'Concluído';
    return 'Em andamento';
  }

  get iconePrazo(): string {
    if (this.prazoEncerrado) return 'lock-closed-outline';
    if (this.atividade.status === 'concluido') return 'checkmark-circle-outline';
    return 'time-outline';
  }

  get estaNoCaderno(): boolean {
    return this.atividade.noCaderno.some(u => u.id === this.usuario.id);
  }

  alterarStatus(status: string) {
    if (this.prazoEncerrado || !this.estaNoCaderno) return;
    this.atividade.status = status;
    this.atividadeService.salvar(this.atividade).subscribe();
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