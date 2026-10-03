// v2: quanto de cada matéria já foi distribuído em atividades, período por período.
// Ajuda a turma a ver, por exemplo, que Matemática já tem 20 dos 25 pontos do
// 2º bimestre lançados e que só cabem mais 5.

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronForwardOutline, createOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { SalaModel } from 'src/app/model/sala.model';
import { PeriodoModel } from 'src/app/model/periodo.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { SalaService } from 'src/app/services/sala.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import {
  PontosDaMateria,
  formatarDataBr,
  periodoAtual,
  pontosPorMateria,
  situacaoPeriodo
} from 'src/app/utils/periodo.util';

@Component({
  selector: 'app-sala-pontos',
  templateUrl: './sala-pontos.page.html',
  // Reaproveita os estilos da sala (.group, .row, filtros...).
  styleUrls: ['../sala/sala.page.scss', '../sala-atividades/sala-atividades.page.scss', './sala-pontos.page.scss'],
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
    CommonModule
  ]
})
export class SalaPontosPage {

  sala: SalaModel = new SalaModel();
  usuario: UsuarioModel;
  idSala = '';
  carregando = true;

  periodoSelecionado: PeriodoModel | null = null;
  idPeriodoAtual = '';
  linhas: PontosDaMateria[] = [];

  readonly formatarDataBr = formatarDataBr;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private navController: NavController,
    private salaService: SalaService,
    private usuarioService: UsuarioService
  ) {
    this.usuario = this.usuarioService.buscarAutenticacao();
    addIcons({ calendarOutline, chevronForwardOutline, createOutline });
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
    this.salaService.buscarPorId(this.idSala).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: (sala) => {
        this.sala = sala;
        this.sala.atividades = sala.atividades || [];
        this.sala.periodos = sala.periodos || [];
        this.sala.materias = sala.materias || [];

        const atual = periodoAtual(this.sala.periodos);
        this.idPeriodoAtual = atual?.id ?? '';

        // Mantém o período escolhido ao recarregar; na primeira vez abre no atual
        const escolhido = this.sala.periodos.find(p => p.id === this.periodoSelecionado?.id)
          ?? this.sala.periodos.find(p => p.id === this.activatedRoute.snapshot.queryParams['periodo'])
          ?? atual;
        this.selecionarPeriodo(escolhido ?? null);
      },
      error: () => {
        mostrarAviso('Não foi possível carregar a sala.');
        this.navController.navigateBack(['/sala', this.idSala]);
      }
    });
  }

  selecionarPeriodo(periodo: PeriodoModel | null) {
    this.periodoSelecionado = periodo;
    this.linhas = periodo
      ? pontosPorMateria(this.sala.materias, this.sala.atividades, periodo)
          // Quem tem mais pontos lançados aparece primeiro; empate, ordem alfabética
          .sort((a, b) => b.distribuidos - a.distribuidos || a.nomeMateria.localeCompare(b.nomeMateria, 'pt-BR'))
      : [];
  }

  get liderLogado(): boolean {
    return !!this.usuario?.id && this.usuario.id === this.sala.idLider;
  }

  get situacao(): string {
    return this.periodoSelecionado ? situacaoPeriodo(this.periodoSelecionado) : '';
  }

  get totalDistribuido(): number {
    return Math.round(this.linhas.reduce((soma, l) => soma + l.distribuidos, 0) * 100) / 100;
  }

  get totalPossivel(): number {
    return Math.round(this.linhas.reduce((soma, l) => soma + l.maximo, 0) * 100) / 100;
  }

  percentual(linha: PontosDaMateria): number {
    return linha.maximo ? Math.min(100, (linha.distribuidos / linha.maximo) * 100) : 0;
  }

  /** Abre as atividades da sala já filtradas pela matéria e pelo período. */
  abrirAtividades(linha: PontosDaMateria) {
    this.router.navigate(['/sala', this.idSala, 'atividades'], {
      queryParams: { materia: linha.idMateria, periodo: this.periodoSelecionado?.id, aba: 'todas' }
    });
  }

  editarPeriodos() {
    this.router.navigate(['/add-sala-editar', this.idSala]);
  }

  atualizar(event: any) {
    this.carregar(event);
  }
}
