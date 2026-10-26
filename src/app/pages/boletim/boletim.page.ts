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
  alertCircleOutline,
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
import {
  AnaliseMateria,
  Boletim,
  LinhaBoletim,
  META_APROVACAO,
  ORDEM_SITUACOES,
  ROTULO_SITUACAO,
  ResumoSituacoes,
  SituacaoMateria,
  analisarMateria,
  atividadesSemNota,
  descreverSituacao,
  ExcessoAvulsas,
  excessosDeAvulsas,
  formatarPontos,
  juntarNomes,
  pts,
  montarBoletim,
  resumirSituacoes
} from 'src/app/utils/boletim.util';

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
      addOutline, alertCircleOutline, calendarOutline, chevronDownOutline, chevronForwardOutline,
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
        this.montarVisao();
        // Com 4 bimestres + "Ano" as abas passam da largura da tela: rola até a selecionada
        setTimeout(() => document.querySelector('app-boletim .filtro-btn.ativo')
          ?.scrollIntoView({ inline: 'center', block: 'nearest' }));
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
    this.mostrarPendentes = false;
    this.montarVisao();
  }

  // ===================== dados da visão atual =====================
  // Feito com auxílio do Claude. Recalculados só quando muda a visão ou chegam dados
  // novos, e não a cada ciclo de detecção de mudanças da tela.

  linhas: LinhaBoletim[] = [];
  analises = new Map<string, AnaliseMateria>();
  resumo: ResumoSituacoes | null = null;
  pendentes: AtividadeModel[] = [];
  mostrarPendentes = false;
  /** Matérias/períodos em que as avulsas do aluno passam do limite (ver excessoNoPeriodo). */
  excessos: ExcessoAvulsas[] = [];
  excessoPorMateria = new Map<string, number>();

  /** Meta do "quanto falta", em % (60). */
  readonly metaPercentual = Math.round(META_APROVACAO * 100);
  readonly ordemSituacoes = ORDEM_SITUACOES;
  readonly rotuloSituacao = ROTULO_SITUACAO;
  readonly formatarPontos = formatarPontos;

  private montarVisao() {
    if (!this.boletim) {
      this.linhas = [];
      this.analises = new Map();
      this.resumo = null;
      this.pendentes = [];
      this.excessos = [];
      this.excessoPorMateria = new Map();
      return;
    }
    const periodo = this.boletim.periodos.find(p => p.periodo.id === this.visao);
    this.linhas = this.visao === 'ano' ? this.boletim.ano : (periodo?.linhas ?? []);
    // o excesso das avulsas vem antes: a matéria com excesso vira "Revisar notas"
    this.excessos = excessosDeAvulsas(this.sala, this.notas, this.visao === 'ano' ? undefined : this.visao);
    this.excessoPorMateria = new Map();
    this.excessos.forEach(e => this.excessoPorMateria.set(e.idMateria, (this.excessoPorMateria.get(e.idMateria) || 0) + e.excesso));
    this.analises = new Map(this.linhas.map(linha =>
      [linha.idMateria, analisarMateria(linha, META_APROVACAO, this.excessoPorMateria.get(linha.idMateria) || 0)]));
    this.resumo = resumirSituacoes(this.linhas, META_APROVACAO, this.excessoPorMateria);
    this.pendentes = atividadesSemNota(this.sala, this.notas, this.visao === 'ano' ? undefined : this.visao);
  }

  /**
   * Feito com auxílio do Claude: "Resolver" do aviso de excesso. Abre a avulsa de maior valor
   * daquela matéria/período, já mostrando quanto ainda cabe (?ajustar=1 no add-nota).
   */
  resolverExcesso(excesso: ExcessoAvulsas) {
    const avulsa = this.notas
      .filter(n => n.avulsa && n.idMateria === excesso.idMateria && n.idPeriodo === excesso.idPeriodo)
      .sort((a, b) => b.valorMaximo - a.valorMaximo)[0];
    if (!avulsa) return;
    this.router.navigate(['/sala', this.idSala, 'nota', avulsa.id], { queryParams: { ajustar: 1 } });
  }

  /** Aviso do topo quando alguma avulsa passou do limite do período. */
  get textoExcesso(): string {
    if (!this.excessos.length) return '';
    const nomes = [...new Set(this.excessos.map(e => e.nomeMateria))];
    if (this.excessos.length === 1) {
      const e = this.excessos[0];
      return `Em ${e.nomeMateria} (${e.nomePeriodo}), suas notas avulsas passam do limite do período em ${pts(e.excesso)}.`;
    }
    return `Suas notas avulsas passam do limite do período em ${juntarNomes(nomes, 4)}.`;
  }


  analise(linha: LinhaBoletim): AnaliseMateria {
    return this.analises.get(linha.idMateria) ?? analisarMateria(linha);
  }

  descricao(linha: LinhaBoletim): string {
    return descreverSituacao(linha, this.analise(linha));
  }

  /** Título do card de situação: aponta as matérias que pedem foco. */
  get tituloResumo(): string {
    const resumo = this.resumo;
    if (!resumo || !resumo.total) return 'Nenhuma matéria vale pontos aqui';
    if (resumo.contagem['revisar']) {
      const nomes = resumo.foco.filter(l => (this.excessoPorMateria.get(l.idMateria) || 0) > 0).map(l => l.nomeMateria);
      return `Revise as notas avulsas de ${juntarNomes(nomes)}`;
    }
    if (resumo.foco.length) return `Foque em ${juntarNomes(resumo.foco.map(l => l.nomeMateria))}`;
    if (resumo.contagem['atingida'] === resumo.total) return 'Meta atingida em todas as matérias';
    if (resumo.contagem['sem-notas'] === resumo.total) {
      return this.visao === 'ano' ? 'Nenhuma nota lançada ainda' : 'Nenhuma nota lançada neste período';
    }
    return 'Tudo no caminho';
  }

  rotuloContagem(situacao: SituacaoMateria, quantidade: number): string {
    switch (situacao) {
      case 'revisar': return `${quantidade} para revisar`;
      case 'atingida': return `${quantidade} com meta atingida`;
      case 'no-caminho': return `${quantidade} no caminho`;
      case 'atencao': return `${quantidade} em atenção`;
      case 'fora-de-alcance': return `${quantidade} fora de alcance`;
      case 'sem-notas': return `${quantidade} sem notas`;
      default: return String(quantidade);
    }
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

  novaAvulsa(idMateria?: string) {
    const query: Record<string, string> = {};
    if (this.visao !== 'ano') query['periodo'] = this.visao;
    if (idMateria) query['materia'] = idMateria;
    this.router.navigate(['/sala', this.idSala, 'nota'], { queryParams: query });
  }

  editarNota(nota: NotaModel) {
    this.router.navigate(['/sala', this.idSala, 'nota', nota.id]);
  }

  async exportar() {
    if (!this.boletim || this.exportando) return;
    // feito com auxílio do Claude: com avulsa acima do limite a conta da matéria fica inflada,
    // e o PDF sairia com um número impossível. Só libera depois de ajustar.
    const pendencias = excessosDeAvulsas(this.sala, this.notas);
    if (pendencias.length) {
      const onde = juntarNomes(pendencias.map(e => `${e.nomeMateria} (${e.nomePeriodo})`), 3);
      mostrarAviso(`Antes de gerar o PDF, ajuste as notas avulsas de ${onde}: elas passam do limite do período.`, 5000);
      return;
    }
    this.exportando = true;
    try {
      const { exportarBoletimPdf } = await import('src/app/utils/boletim-pdf.util');
      await exportarBoletimPdf({
        boletim: this.boletim,
        nomeSala: this.sala.nome,
        nomeAluno: this.usuario?.nome || 'Aluno',
        excessos: excessosDeAvulsas(this.sala, this.notas),
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
