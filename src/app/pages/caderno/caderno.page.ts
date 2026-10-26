import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  timeOutline,
  checkmarkCircleOutline,
  calendarOutline,
  homeOutline,
  peopleOutline,
  personOutline,
  ellipseOutline,
  searchOutline,
  closeOutline,
  chevronForwardOutline,
  archiveOutline,
  chevronDownOutline,
  chevronUpOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { TarefaModel } from 'src/app/model/tarefa.model';
import { TarefaService } from 'src/app/services/tarefa.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { finalize } from 'rxjs';
import { DIAS_ATE_ARQUIVAR, classeUrgencia, compararPorEntrega, deveArquivar } from 'src/app/utils/urgencia.util';
import { parsearData } from 'src/app/utils/data.util';

// bloco da lista do caderno ("Atrasadas", "Hoje"...)
interface SecaoCaderno {
  chave: string;
  titulo: string;
  atividades: AtividadeModel[];
  alerta?: boolean;
}
import { formatarDataCurta } from 'src/app/utils/data.util';
import { AtividadeItemComponent } from 'src/app/components/atividade-item/atividade-item.component';
import { labelPontos } from 'src/app/utils/pontos.util';
import { criarRecarregadorDeAba } from 'src/app/utils/recarregar-aba.util';

@Component({
  selector: 'app-caderno',
  templateUrl: './caderno.page.html',
  styleUrls: ['./caderno.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    RouterLink,
    AtividadeItemComponent
  ]
})
export class CadernoPage implements OnInit {

  usuario: UsuarioModel;
  atividades: AtividadeModel[];
  atividadesFiltradas: AtividadeModel[];
  // as atividades à vista, em ordem de prazo e separadas por quando vencem
  secoesAtividades: SecaoCaderno[] = [];
  // concluídas com prazo vencido ou atrasadas há mais de 3 dias (regra em deveArquivar). ficam recolhidas no fim
  atividadesArquivadas: AtividadeModel[] = [];
  // null = automático (abre sozinha com busca ou filtro); true/false = o aluno abriu ou fechou na mão
  mostrarArquivadas: boolean | null = null;
  readonly DIAS_ATE_ARQUIVAR = DIAS_ATE_ARQUIVAR;
  tarefas: TarefaModel[];
  tarefasFiltradas: TarefaModel[];
  filtroAtivo: string;
  // matéria escolhida (vazio = todas). é pelo nome pq o caderno junta várias salas
  filtroMateria = '';
  termoBusca: string;
  carregando = true;
  private pendentesCarregamento = 0;

  constructor(
    private usuarioService: UsuarioService,
    private atividadeService: AtividadeService,
    private tarefaService: TarefaService
  ) {
    this.usuario = new UsuarioModel();
    this.atividades = [];
    this.atividadesFiltradas = [];
    this.tarefas = [];
    this.tarefasFiltradas = [];
    this.filtroAtivo = 'todas';
    this.termoBusca = '';

    addIcons({
      bookOutline,
      timeOutline,
      checkmarkCircleOutline,
      calendarOutline,
      homeOutline,
      peopleOutline,
      personOutline,
      ellipseOutline,
      searchOutline,
      closeOutline,
      chevronForwardOutline,
      archiveOutline,
      chevronDownOutline,
      chevronUpOutline,
      alertCircleOutline
    });
  }

  ngOnInit() { }

  // recarrega o caderno ao voltar para a aba (ex.: depois de mudar o status de uma atividade)
  private recarregador = criarRecarregadorDeAba(inject(Router), '/tabs/caderno', () => {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregarCaderno();
  });

  ionViewWillEnter() {
    this.recarregador.executar();
  }

  ngOnDestroy() {
    this.recarregador.encerrar();
  }

  carregarCaderno(event?: any) {
    if (!this.usuario.id) {
      this.atividades = [];
      this.atividadesFiltradas = [];
      this.atividadesArquivadas = [];
      this.tarefas = [];
      this.tarefasFiltradas = [];
      this.termoBusca = '';
      this.carregando = false;
      event?.target.complete();
      return;
    }

    this.pendentesCarregamento = 2;
    const finalizarUma = () => {
      this.pendentesCarregamento--;
      if (this.pendentesCarregamento <= 0) {
        this.carregando = false;
        event?.target.complete();
      }
    };

    this.atividadeService.listarMeuCaderno().pipe(
      finalize(finalizarUma)
    ).subscribe({
      next: (res) => {
        this.atividades = res;
        this.aplicarFiltros();
      },
      error: () => {
        this.atividades = [];
        this.atividadesFiltradas = [];
        this.atividadesArquivadas = [];
      }
    });

    this.tarefaService.listarMinhas().pipe(
      finalize(finalizarUma)
    ).subscribe({
      next: (res) => {
        this.tarefas = res || [];
        this.aplicarFiltros();
      },
      error: () => {
        this.tarefas = [];
        this.tarefasFiltradas = [];
      }
    });
  }

  atualizar(event: any) {
    this.carregarCaderno(event);
  }

  filtrar(filtro: string) {
    this.filtroAtivo = filtro;
    this.aplicarFiltros();
  }

  buscar() {
    this.aplicarFiltros();
  }

  filtrarMateria(nome: string) {
    this.filtroMateria = this.filtroMateria === nome ? '' : nome;
    this.aplicarFiltros();
  }

  // matérias que aparecem no caderno (atividades e tarefas), em ordem alfabética
  get materiasDoCaderno(): string[] {
    const nomes = new Set<string>();
    this.atividades.forEach(a => a.nomeMateria && nomes.add(a.nomeMateria));
    this.tarefas.forEach(t => t.materiaAtividade && nomes.add(t.materiaAtividade));
    return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  limparBusca() {
    this.termoBusca = '';
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    const termo = this.normalizarTexto(this.termoBusca);

    const atividadesQueBatem = this.atividades.filter(atividade => {
      const bateStatus = this.filtroAtivo === 'todas' || atividade.status === this.filtroAtivo;
      const bateBusca = !termo || this.textoBuscaAtividade(atividade).includes(termo);
      const bateMateria = !this.filtroMateria || atividade.nomeMateria === this.filtroMateria;

      return bateStatus && bateBusca && bateMateria;
    });

    // as arquivadas saem da lista principal e vão para a seção recolhida no fim
    this.atividadesFiltradas = atividadesQueBatem.filter(atividade => !deveArquivar(atividade)).sort(compararPorEntrega);
    this.atividadesArquivadas = atividadesQueBatem.filter(atividade => deveArquivar(atividade))
      .sort((a, b) => compararPorEntrega(b, a));
    this.secoesAtividades = this.montarSecoes(this.atividadesFiltradas);

    this.tarefasFiltradas = this.tarefas.filter(tarefa => {
      const bateStatus = this.filtroAtivo === 'todas' || this.statusNormalizadoTarefa(tarefa.status) === this.filtroAtivo;
      const bateBusca = !termo || this.textoBuscaTarefa(tarefa).includes(termo);
      const bateMateria = !this.filtroMateria || tarefa.materiaAtividade === this.filtroMateria;

      return bateStatus && bateBusca && bateMateria;
    }).sort((a, b) => this.chavePrazoTarefa(a).localeCompare(this.chavePrazoTarefa(b)));
  }

  // concluídas por último; entre as outras, a de prazo mais perto primeiro e as sem prazo no fim
  private chavePrazoTarefa(tarefa: TarefaModel): string {
    const concluida = tarefa.status === 'concluido' ? '1' : '0';
    return concluida + (tarefa.prazo || '9999-12-31');
  }

  classeUrgenciaTarefa(tarefa: TarefaModel): string {
    return classeUrgencia(tarefa.prazo, tarefa.status);
  }

  textoBuscaAtividade(atividade: AtividadeModel): string {
    return this.normalizarTexto([
      atividade.titulo,
      atividade.descricao,
      atividade.nomeMateria,
      atividade.nomePeriodo,
      atividade.valor?.toString(),
      this.formatarData(atividade.dataEntrega),
      atividade.dataEntrega
    ].join(' '));
  }

  textoBuscaTarefa(tarefa: TarefaModel): string {
    return this.normalizarTexto([
      tarefa.titulo,
      tarefa.status,
      tarefa.tituloAtividade,
      tarefa.materiaAtividade,
      tarefa.nomeUsuarioAtribuido,
      tarefa.nomeCriador,
      this.formatarData(tarefa.prazo || ''),
      tarefa.prazo
    ].join(' '));
  }

  statusNormalizadoTarefa(status: string | null): string {
    if (!status || status === 'pendente') return 'nao_iniciada';
    return status;
  }

  get temResultados(): boolean {
    return this.atividadesFiltradas.length > 0 || this.atividadesArquivadas.length > 0 || this.tarefasFiltradas.length > 0;
  }

  // separa as atividades (já em ordem de prazo) pelo que fazer primeiro, igual a agenda do início
  // as concluídas que ainda n venceram ficam num bloco no fim, pra n misturar com o que falta fazer
  private montarSecoes(atividades: AtividadeModel[]): SecaoCaderno[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const secoes: SecaoCaderno[] = [
      { chave: 'atrasadas', titulo: 'Atrasadas', atividades: [], alerta: true },
      { chave: 'hoje', titulo: 'Hoje', atividades: [] },
      { chave: 'semana', titulo: 'Próximos 7 dias', atividades: [] },
      { chave: 'depois', titulo: 'Mais para frente', atividades: [] },
      { chave: 'concluidas', titulo: 'Concluídas', atividades: [] },
    ];
    const [atrasadas, deHoje, semana, depois, concluidas] = secoes;

    for (const atividade of atividades) {
      if (atividade.status === 'concluido') {
        concluidas.atividades.push(atividade);
        continue;
      }

      const prazo = parsearData(atividade.dataEntrega);
      const dias = prazo ? Math.round((prazo.getTime() - hoje.getTime()) / 86400000) : Number.MAX_SAFE_INTEGER;
      if (dias < 0) atrasadas.atividades.push(atividade);
      else if (dias === 0) deHoje.atividades.push(atividade);
      else if (dias <= 7) semana.atividades.push(atividade);
      else depois.atividades.push(atividade);
    }

    return secoes.filter(secao => secao.atividades.length > 0);
  }

  // com busca ou filtro ativo, as arquivadas aparecem abertas (senão o resultado ficaria escondido)
  get arquivadasAbertas(): boolean {
    return this.mostrarArquivadas ?? (!!this.termoBusca.trim() || this.filtroAtivo !== 'todas' || !!this.filtroMateria);
  }

  normalizarTexto(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  iconeStatus(status: string | null): string {
    switch (status) {
      case 'concluido':
        return 'checkmark-circle-outline';
      case 'nao_iniciada':
      case 'pendente':
      case null:
      case undefined:
        return 'ellipse-outline';
      default:
        return 'time-outline';
    }
  }

  labelStatus(status: string | null): string {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'nao_iniciada':
      case 'pendente':
      case null:
      case undefined:
        return 'Não iniciada';
      default:
        return 'Em andamento';
    }
  }

  classeStatus(status: string | null): string {
    return this.statusNormalizadoTarefa(status);
  }

  // classe de urgência (psicologia das cores, mesmo padrão do calendário) pro rótulo de data
  classeUrgencia(atividade: AtividadeModel): string {
    return classeUrgencia(atividade.dataEntrega, atividade.status);
  }

  formatarData(data: string): string {
    if (!data) return '';

    return formatarDataCurta(data);
  }

  labelPontos(valor: number | string): string {
    return labelPontos(valor);
  }
}
