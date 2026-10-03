// v2: boletim pessoal da sala. Cada aluno lança as próprias notas (de atividades da
// sala ou avulsas) e vê o total por matéria em cada período e no ano.

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
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
  documentTextOutline,
  downloadOutline,
  schoolOutline
} from 'ionicons/icons';
import { finalize, forkJoin } from 'rxjs';
import { SalaModel } from 'src/app/model/sala.model';
import { NotaModel } from 'src/app/model/nota.model';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { SalaService } from 'src/app/services/sala.service';
import { NotaService } from 'src/app/services/nota.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { formatarDataBr, periodoAtual } from 'src/app/utils/periodo.util';
import { Boletim, LinhaBoletim, aproveitamento, atividadesSemNota, montarBoletim } from 'src/app/utils/boletim.util';

/** id do período selecionado, ou "ano" para o acumulado. */
type Visao = string;

@Component({
  selector: 'app-boletim',
  templateUrl: './boletim.page.html',
  styleUrls: ['../sala/sala.page.scss', '../sala-atividades/sala-atividades.page.scss', '../sala-pontos/sala-pontos.page.scss', './boletim.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    CommonModule
  ]
})
export class BoletimPage {

  sala: SalaModel = new SalaModel();
  notas: NotaModel[] = [];
  boletim: Boletim | null = null;
  usuario: UsuarioModel;
  idSala = '';
  carregando = true;
  exportando = false;

  visao: Visao = 'ano';
  idPeriodoAtual = '';
  /** Matérias com a lista de notas aberta. */
  abertas = new Set<string>();

  readonly formatarDataBr = formatarDataBr;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private navController: NavController,
    private salaService: SalaService,
    private notaService: NotaService,
    private usuarioService: UsuarioService
  ) {
    this.usuario = this.usuarioService.buscarAutenticacao();
    addIcons({
      addOutline, calendarOutline, chevronDownOutline, chevronForwardOutline,
      chevronUpOutline, documentTextOutline, downloadOutline, schoolOutline
    });
  }

  ionViewWillEnter() {
    this.idSala = this.activatedRoute.snapshot.params['id'] || '';
    this.usuario = this.usuarioService.buscarAutenticacao();
    if (this.idSala) {
      this.carregar();
    } else {
      this.carregando = false;
    }
  }

  carregar(event?: any) {
    forkJoin({
      sala: this.salaService.buscarPorId(this.idSala),
      notas: this.notaService.listarDaSala(this.idSala),
    }).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: ({ sala, notas }) => {
        this.sala = sala;
        this.sala.periodos = sala.periodos || [];
        this.sala.materias = sala.materias || [];
        this.sala.atividades = sala.atividades || [];
        this.notas = notas || [];
        this.boletim = montarBoletim(this.sala, this.notas);

        const atual = periodoAtual(this.sala.periodos);
        this.idPeriodoAtual = atual?.id ?? '';
        // Primeira abertura: período atual. Recarregando: mantém o que estava aberto.
        const visaoValida = this.visao === 'ano' || this.sala.periodos.some(p => p.id === this.visao);
        if (!visaoValida || (this.visao === 'ano' && !this.jaEscolheuVisao)) {
          this.visao = atual?.id ?? 'ano';
        }
      },
      error: () => {
        mostrarAviso('Não foi possível carregar o boletim.');
        this.navController.navigateBack(['/sala', this.idSala]);
      }
    });
  }

  private jaEscolheuVisao = false;

  selecionarVisao(visao: Visao) {
    this.visao = visao;
    this.jaEscolheuVisao = true;
  }

  // ===================== dados da visão atual =====================

  get periodoDaVisao() {
    return this.boletim?.periodos.find(p => p.periodo.id === this.visao) ?? null;
  }

  get linhas(): LinhaBoletim[] {
    if (!this.boletim) return [];
    return this.visao === 'ano' ? this.boletim.ano : (this.periodoDaVisao?.linhas ?? []);
  }

  get totalObtido(): number {
    if (!this.boletim) return 0;
    return this.visao === 'ano' ? this.boletim.obtidoAno : (this.periodoDaVisao?.obtido ?? 0);
  }

  get totalAvaliado(): number {
    if (!this.boletim) return 0;
    return this.visao === 'ano' ? this.boletim.avaliadoAno : (this.periodoDaVisao?.avaliado ?? 0);
  }

  get totalMaximo(): number {
    if (!this.boletim) return 0;
    return this.visao === 'ano' ? this.boletim.maximoAno : (this.periodoDaVisao?.maximo ?? 0);
  }

  get pendentes(): AtividadeModel[] {
    return atividadesSemNota(this.sala, this.notas, this.visao === 'ano' ? undefined : this.visao);
  }

  aproveitamento(obtido: number, avaliado: number): number | null {
    return aproveitamento(obtido, avaliado);
  }

  /** Barra: parte obtida e parte avaliada sobre o máximo possível. */
  largura(valor: number, maximo: number): number {
    return maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0;
  }

  alternar(idMateria: string) {
    if (this.abertas.has(idMateria)) {
      this.abertas.delete(idMateria);
    } else {
      this.abertas.add(idMateria);
    }
  }

  // ===================== ações =====================

  lancarDaAtividade(atividade: AtividadeModel) {
    this.router.navigate(['/sala', this.idSala, 'nota'], { queryParams: { atividade: atividade.id } });
  }

  novaAvulsa() {
    const query: Record<string, string> = {};
    if (this.visao !== 'ano') query['periodo'] = this.visao;
    this.router.navigate(['/sala', this.idSala, 'nota'], { queryParams: query });
  }

  editarNota(nota: NotaModel) {
    this.router.navigate(['/sala', this.idSala, 'nota', nota.id]);
  }

  async exportar() {
    if (!this.boletim || this.exportando) return;
    this.exportando = true;
    try {
      const { exportarBoletimPdf } = await import('src/app/utils/boletim-pdf.util');
      await exportarBoletimPdf({
        boletim: this.boletim,
        nomeSala: this.sala.nome,
        nomeAluno: this.usuario?.nome || 'Aluno',
      });
    } catch (erro: any) {
      // Fechar a folha de compartilhamento sem escolher nada não é erro
      if (!String(erro?.message || '').toLowerCase().includes('cancel')) {
        console.error('Erro ao exportar boletim', erro);
        mostrarAviso('Não foi possível gerar o PDF do boletim.');
      }
    } finally {
      this.exportando = false;
    }
  }

  atualizar(event: any) {
    this.carregar(event);
  }
}
