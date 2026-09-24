// feito com auxílio do Claude
//
// Lista completa de atividades de uma sala, separada em "Próximas" (o dia de
// entrega ainda não terminou) e "Arquivadas" (o dia de entrega já passou).
// A página da sala mostra só uma prévia com as próximas mais urgentes.

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  archiveOutline,
  bookmarkOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  ellipseOutline,
  timeOutline
} from 'ionicons/icons';
import { finalize } from 'rxjs';
import { SalaModel } from 'src/app/model/sala.model';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { SalaService } from 'src/app/services/sala.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { classeUrgencia, compararPorEntrega, estaArquivada } from 'src/app/utils/urgencia.util';
import { classeStatus, iconeStatus, labelStatus } from 'src/app/utils/atividade-status.util';
import { labelPontos } from 'src/app/utils/pontos.util';

type Aba = 'proximas' | 'arquivadas';

@Component({
  selector: 'app-sala-atividades',
  templateUrl: './sala-atividades.page.html',
  // Reaproveita os estilos de lista da página da sala (.group, .row, tags...).
  styleUrls: ['../sala/sala.page.scss', './sala-atividades.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    RouterLink
  ]
})
export class SalaAtividadesPage {

  sala: SalaModel;
  usuario: UsuarioModel;
  idSala = '';
  carregando = true;

  aba: Aba = 'proximas';
  proximas: AtividadeModel[] = [];
  arquivadas: AtividadeModel[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private toastController: ToastController,
    private salaService: SalaService,
    private usuarioService: UsuarioService
  ) {
    this.sala = new SalaModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    addIcons({
      addOutline,
      archiveOutline,
      bookmarkOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      ellipseOutline,
      timeOutline
    });
  }

  ionViewWillEnter() {
    this.idSala = this.activatedRoute.snapshot.params['id'] || '';

    if (this.idSala) {
      this.carregar();
    } else {
      this.carregando = false;
    }
  }

  carregar(event?: any) {
    this.salaService.buscarPorId(this.idSala, this.usuario.id).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: (res) => {
        this.sala = res;
        this.sala.id = this.sala.id || this.idSala;
        this.organizar(this.sala.atividades || []);
      },
      error: () => {
        this.exibirMensagem('Não foi possível carregar as atividades.');
        this.navController.navigateBack(['/sala', this.idSala]);
      }
    });
  }

  atualizar(event: any) {
    this.carregar(event);
  }

  /** Próximas: da entrega mais perto para a mais longe. Arquivadas: da mais recente para a mais antiga. */
  organizar(atividades: AtividadeModel[]) {
    this.proximas = atividades
      .filter(atividade => !estaArquivada(atividade.dataEntrega))
      .sort(compararPorEntrega);

    this.arquivadas = atividades
      .filter(atividade => estaArquivada(atividade.dataEntrega))
      .sort((a, b) => compararPorEntrega(b, a));
  }

  selecionarAba(aba: Aba) {
    this.aba = aba;
  }

  get listaAtual(): AtividadeModel[] {
    return this.aba === 'proximas' ? this.proximas : this.arquivadas;
  }

  classeStatus(status: string | null): string {
    return classeStatus(status);
  }

  iconeStatus(status: string | null): string {
    return iconeStatus(status);
  }

  labelStatus(status: string | null): string {
    return labelStatus(status);
  }

  labelPontos(valor: number | string): string {
    return labelPontos(valor);
  }

  /** Nas arquivadas o prazo já passou, então a data fica neutra em vez de vermelha. */
  classeUrgencia(atividade: AtividadeModel): string {
    return this.aba === 'proximas' ? classeUrgencia(atividade.dataEntrega, atividade.status) : '';
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });

    toast.present();
  }
}
