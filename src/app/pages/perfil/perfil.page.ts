import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonIcon, IonLabel, IonTabButton, IonTabBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, trophyOutline, personOutline, pencilOutline, logOutOutline, bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline, sunnyOutline, moonOutline, trashOutline, notificationsOutline, chevronForwardOutline } from 'ionicons/icons';
import { UsuarioService } from 'src/app/services/usuario.service';
import { AlertController, ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AtividadeService } from 'src/app/services/atividade.service';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { TemaService } from 'src/app/services/tema.service';
import { LoginService } from 'src/app/services/login.service';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { NotificacaoPushService } from 'src/app/services/notificacao-push.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonButton, IonIcon, IonLabel, IonTabButton, IonTabBar,
    CommonModule,
    RouterModule,
  ],
})
export class PerfilPage implements OnInit {

  atividades: AtividadeModel[] = [];
  atividadesFiltradas: AtividadeModel[] = [];
  filtroAtivo: string = 'todas';
  temaClaro: boolean = false;
  inativando = false;
  testandoNotificacaoPush = false;

  usuario = {
    id: this.usuarioService.buscarAutenticacao().id,
    nome: this.usuarioService.buscarAutenticacao().nome,
    foto: this.usuarioService.buscarAutenticacao().foto,
  };

  get iniciais(): string {
    const nome = this.usuario?.nome?.trim() || '';
    return nome
      .split(' ')
      .filter((p: string) => p.length > 0)
      .map((p: string) => p[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private navController: NavController,
    private atividadeService: AtividadeService,
    private temaService: TemaService,
    private loginService: LoginService,
    private confirmacaoService: ConfirmacaoService,
    private toastController: ToastController,
    private alertController: AlertController,
    private notificacaoPushService: NotificacaoPushService
  ) {
    addIcons({
      pencilOutline, homeOutline, trophyOutline, personOutline, logOutOutline, bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline, sunnyOutline, moonOutline, trashOutline, notificationsOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.usuario = {
      id: this.usuarioService.buscarAutenticacao().id,
      nome: this.usuarioService.buscarAutenticacao().nome,
      foto: this.usuarioService.buscarAutenticacao().foto,
    };
    this.temaClaro = this.temaService.temaClaroAtivo();
    this.carregarCaderno();
  }

  carregarCaderno() {
    const usuario = this.usuarioService.buscarAutenticacao();

    if (!usuario.id) {
      this.atividades = [];
      this.atividadesFiltradas = [];
      return;
    }

    this.atividadeService.listarPorUsuarioNoCaderno(usuario.id).subscribe({
      next: (res) => {
        this.atividades = res;
        this.filtrar(this.filtroAtivo);
      },
      error: () => {
        this.atividades = [];
        this.atividadesFiltradas = [];
      }
    });
  }

  filtrar(filtro: string) {
    this.filtroAtivo = filtro;
    if (filtro === 'todas') {
      this.atividadesFiltradas = this.atividades;
    } else {
      this.atividadesFiltradas = this.atividades.filter(a => {
        const status = a.status || 'nao_iniciada';
        return status === filtro;
      });
    }
  }

  iconeStatus(status: string | null): string {
    const s = status || 'nao_iniciada';
    return s === 'concluido' ? 'checkmark-circle-outline' : 'time-outline';
  }

  labelStatus(status: string | null): string {
    const s = status || 'nao_iniciada';
    if (s === 'concluido') return 'Concluído';
    if (s === 'nao_iniciada') return 'Não iniciada';
    return 'Em andamento';
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]}`;
  }

  editarPerfil() {
    this.router.navigate(['usuario']);
  }

  async logout() {
    await this.notificacaoPushService.desregistrar().catch(() => undefined);
    this.loginService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }

  alternarTema() {
    this.temaClaro = this.temaService.alternarTema();
  }

  async testarNotificacao(): Promise<void> {
    if (this.testandoNotificacaoPush) return;
    this.testandoNotificacaoPush = true;

    try {
      await this.notificacaoPushService.testar();
      const toast = await this.toastController.create({
        message: 'Notificação push solicitada ao servidor. Ela deve chegar em instantes.',
        duration: 5000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (erro: any) {
      const toast = await this.toastController.create({
        message: erro?.message || 'Não foi possível solicitar a notificação push de teste.',
        duration: 6000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.testandoNotificacaoPush = false;
    }
  }

  async inativarConta() {
    if (this.inativando) return;
    const confirmou = await this.confirmacaoService.confirmar(
      'Inativar conta',
      'A inativação será bloqueada enquanto você for líder de alguma sala ou grupo, ou tiver tarefas atribuídas ao seu nome. Transfira as lideranças e reatribua as tarefas antes de continuar.\n\nSua conta será inativada e seus comentários serão preservados como histórico. Esta ação não pode ser desfeita pelo aplicativo.',
      'Inativar'
    );
    if (!confirmou) return;

    this.inativando = true;
    this.usuarioService.excluir(this.usuario.id).pipe(
      finalize(() => this.inativando = false)
    ).subscribe({
      next: () => {
        void this.notificacaoPushService.desregistrar().catch(() => undefined);
        this.loginService.encerrarAutenticacao();
        this.navController.navigateRoot('/login');
      },
      error: async erro => {
        const mensagem = erro?.error?.message || erro?.error?.detail || 'Não foi possível inativar a conta.';
        if (erro?.status === 409) {
          const alerta = await this.alertController.create({
            header: 'Conta ainda possui vínculos',
            message: `${mensagem}\n\nTransfira as lideranças das salas e dos grupos e reatribua todas as tarefas antes de tentar novamente.`,
            cssClass: 'app-confirmation-alert',
            buttons: ['Entendi']
          });
          await alerta.present();
          return;
        }
        const toast = await this.toastController.create({ message: mensagem, duration: 5000, color: 'danger', position: 'top' });
        await toast.present();
        console.error('Erro ao inativar conta:', erro);
      }
    });
  }
}
