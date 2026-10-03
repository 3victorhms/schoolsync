// feito com auxílio do Claude
//
// Lista completa de atividades de uma sala, separada em "Próximas" (o dia de
// entrega ainda não terminou) e "Arquivadas" (o dia de entrega já passou).
// A página da sala mostra só uma prévia com as próximas mais urgentes.
// v2: dá pra filtrar por matéria e por período (a tela de pontos abre já filtrada).

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  layersOutline,
  funnelOutline,
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
import { compararPorEntrega, estaArquivada } from 'src/app/utils/urgencia.util';
import { AtividadeItemComponent } from 'src/app/components/atividade-item/atividade-item.component';
import { mostrarAviso } from 'src/app/utils/aviso.util';

type Aba = 'proximas' | 'arquivadas' | 'todas';

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
    FormsModule,
    RouterLink,
    AtividadeItemComponent
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
  todas: AtividadeModel[] = [];

  /** Filtros v2 (vazio = sem filtro). */
  filtroMateria = '';
  filtroPeriodo = '';

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
      layersOutline,
      funnelOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      ellipseOutline,
      timeOutline
    });
  }

  ionViewWillEnter() {
    this.idSala = this.activatedRoute.snapshot.params['id'] || '';
    // A aba "Arquivadas" da sala abre esta página já na aba certa.
    const query = this.activatedRoute.snapshot.queryParams;
    if (query['aba'] === 'arquivadas' || query['aba'] === 'todas') {
      this.aba = query['aba'];
    }
    // Vindo da tela de pontos: já abre filtrado pela matéria/período
    if (query['materia']) this.filtroMateria = query['materia'];
    if (query['periodo']) this.filtroPeriodo = query['periodo'];

    if (this.idSala) {
      this.carregar();
    } else {
      this.carregando = false;
    }
  }

  carregar(event?: any) {
    this.salaService.buscarPorId(this.idSala).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: (res) => {
        this.sala = res;
        this.sala.id = this.sala.id || this.idSala;
        this.organizar();
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
  organizar() {
    const atividades = (this.sala.atividades || []).filter(atividade =>
      (!this.filtroMateria || atividade.idMateria === this.filtroMateria) &&
      (!this.filtroPeriodo || atividade.idPeriodo === this.filtroPeriodo)
    );

    this.proximas = atividades
      .filter(atividade => !estaArquivada(atividade.dataEntrega))
      .sort(compararPorEntrega);

    this.arquivadas = atividades
      .filter(atividade => estaArquivada(atividade.dataEntrega))
      .sort((a, b) => compararPorEntrega(b, a));

    // "Todas": ordem do calendário (da primeira entrega para a última)
    this.todas = [...atividades].sort(compararPorEntrega);
  }

  get temFiltro(): boolean {
    return !!this.filtroMateria || !!this.filtroPeriodo;
  }

  limparFiltros() {
    this.filtroMateria = '';
    this.filtroPeriodo = '';
    this.organizar();
  }

  selecionarAba(aba: Aba) {
    this.aba = aba;
  }

  get listaAtual(): AtividadeModel[] {
    if (this.aba === 'todas') return this.todas;
    return this.aba === 'proximas' ? this.proximas : this.arquivadas;
  }

  exibirMensagem(texto: string): void {
    mostrarAviso(texto);
  }
}
