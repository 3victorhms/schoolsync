import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { NotificacaoService } from 'src/app/services/notificacao.service';
import { addIcons } from 'ionicons';
import { Subscription, from, of } from 'rxjs';
import { catchError, finalize, mergeMap } from 'rxjs/operators';
import { notificationsOutline, chevronBackOutline, chevronForwardOutline, peopleOutline, documentsOutline, calendarOutline, starOutline, homeOutline, bookOutline, personOutline, pencilOutline, chevronDownOutline, chevronUpOutline, sunnyOutline, alertCircleOutline } from 'ionicons/icons';
import { calcularUrgencia, classeUrgencia, compararPorEntrega, ordemUrgencia } from 'src/app/utils/urgencia.util';
import { labelPontos } from 'src/app/utils/pontos.util';
import { formatarDataCurta, parsearData } from 'src/app/utils/data.util';
import { AtividadeItemComponent } from 'src/app/components/atividade-item/atividade-item.component';
import { criarRecarregadorDeAba } from 'src/app/utils/recarregar-aba.util';

interface DiaCalendario {
  numero: number;
  data: Date;
  mesAtual: boolean;
  hoje: boolean;
  selecionado: boolean;
  indicador?: 'concluida' | 'atrasada' | 'hoje' | 'proxima' | 'semana' | 'mes' | 'futuro';
  resumoAtividades?: string;
}

/** "caderno": só o que o aluno adicionou ao caderno (1 chamada). "todas": atividades de todas as salas. */
type FiltroAgenda = 'caderno' | 'todas';

interface SecaoAgenda {
  chave: string;
  titulo: string;
  atividades: AtividadeModel[];
  alerta?: boolean;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonIcon, IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, RouterLink, AtividadeItemComponent]
})
export class InicioPage implements OnInit {

  usuario: UsuarioModel;
  ultimaSala: SalaModel | null = null;
  carregandoUltimaSala = false;
  diasCalendario: DiaCalendario[] = [];
  atividadesDoDia: AtividadeModel[] = [];
  dataSelecionada: Date = new Date();
  mesAtual: string = '';
  dataAtual: Date = new Date();
  notificacoesNaoLidas = 0;
  atividadesCalendario: AtividadeModel[] = [];
  private notificacoesSubscription?: Subscription;

  // ---------------- Agenda ----------------
  filtro: FiltroAgenda = 'caderno';
  carregandoAgenda = true;
  carregandoTodas = false;
  secoes: SecaoAgenda[] = [];
  atividadesDepois: AtividadeModel[] = [];
  secoesExpandidas = new Set<string>();
  nomesSalas: Record<string, string> = {};
  quantidadeSalas = 0;
  readonly LIMITE_POR_SECAO = 5;
  /** Atrasadas há mais tempo que isso já estão nas "Arquivadas" de cada sala. */
  private readonly DIAS_ATRASADAS = 7;
  private atividadesCaderno: AtividadeModel[] = [];
  /** null = ainda não carregadas (só carrega se o aluno escolher "Todas"). */
  private atividadesTodas: AtividadeModel[] | null = null;

  private meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  constructor(
    private usuarioService: UsuarioService,
    private salaService: SalaService,
    private atividadeService: AtividadeService,
    private notificacaoService: NotificacaoService
  ) {
    this.usuario = this.usuarioService.buscarAutenticacao();
    addIcons({ notificationsOutline, chevronBackOutline, chevronForwardOutline, peopleOutline, documentsOutline, calendarOutline, starOutline, homeOutline, bookOutline, personOutline, pencilOutline, chevronDownOutline, chevronUpOutline, sunnyOutline, alertCircleOutline });
  }

  ngOnInit() { }

  get primeiroNomeUsuario(): string {
    return (this.usuario.nome || '').trim().split(/\s+/)[0] || 'Estudante';
  }

  /** Recarrega agenda e última sala ao voltar para a aba (as abas internas não recebem ionViewWillEnter). */
  private recarregador = criarRecarregadorDeAba(inject(Router), '/tabs/inicio', () => {
    this.carregarUltimaSala();
    this.carregarAgenda();
  });

  ionViewWillEnter() {
    this.recarregador.executar();
    this.notificacaoService.listar().subscribe({ error: () => this.notificacoesNaoLidas = 0 });
    this.notificacaoService.conectar();
    this.notificacoesSubscription?.unsubscribe();
    this.notificacoesSubscription = this.notificacaoService.notificacoes$.subscribe(notificacoes => {
      this.notificacoesNaoLidas = notificacoes.filter(notificacao => !notificacao.lido).length;
    });
  }

  ngOnDestroy() {
    this.recarregador.encerrar();
  }

  ionViewWillLeave() {
    this.notificacoesSubscription?.unsubscribe();
  }

  gerarCalendario() {
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();
    this.mesAtual = `${this.meses[mes]} ${ano}`;

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();

    this.diasCalendario = [];

    // dias do mês anterior
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = primeiroDia - 1; i >= 0; i--) {
      const data = new Date(ano, mes - 1, diasMesAnterior - i);
      this.diasCalendario.push({ numero: diasMesAnterior - i, data, mesAtual: false, hoje: false, selecionado: false });
    }

    // dias do mês atual
    for (let i = 1; i <= ultimoDia; i++) {
      const data = new Date(ano, mes, i);
      const ehHoje = data.toDateString() === hoje.toDateString();
      const selecionado = data.toDateString() === this.dataSelecionada.toDateString();
      this.diasCalendario.push({ numero: i, data, mesAtual: true, hoje: ehHoje, selecionado });
    }

    // dias do próximo mês
    const restante = 42 - this.diasCalendario.length;
    for (let i = 1; i <= restante; i++) {
      const data = new Date(ano, mes + 1, i);
      this.diasCalendario.push({ numero: i, data, mesAtual: false, hoje: false, selecionado: false });
    }

    this.atualizarIndicadoresCalendario();
  }

  formatarData(data: string): string {
    return formatarDataCurta(data);
  }

  selecionarDia(dia: DiaCalendario) {
    this.diasCalendario.forEach(d => d.selecionado = false);
    dia.selecionado = true;
    this.dataSelecionada = dia.data;
    this.carregarAtividadesDoDia();
  }

  mesAnterior() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    this.gerarCalendario();
  }

  proximoMes() {
    this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    this.gerarCalendario();
  }

  get dataSelecionadaLabel(): string {
    const d = this.dataSelecionada;
    return `${d.getDate()} de ${this.meses[d.getMonth()]}`;
  }

  carregarAtividadesDoDia() {
    if (!this.usuario.id) {
      this.atividadesDoDia = [];
      return;
    }

    const d = this.dataSelecionada;
    const dataStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    this.atividadesDoDia = this.atividadesCalendario.filter(a => a.dataEntrega === dataStr);
  }

  // =====================================================================
  // Agenda: começa no caderno (rápido); se o caderno estiver vazio e o
  // aluno nunca escolheu um filtro, mostra "Todas". A escolha fica salva
  // no aparelho, então o cálculo completo só roda para quem pediu.
  // =====================================================================

  private carregarAgenda() {
    if (!this.usuario.id) {
      this.carregandoAgenda = false;
      return;
    }

    this.atividadesTodas = null;
    // Desenha o calendário já (sem as marcações), em vez de deixar o cartão
    // vazio até a API responder; as marcações entram quando os dados chegam.
    if (!this.diasCalendario.length) this.gerarCalendario();
    this.carregarNomesSalas();
    const filtroSalvo = this.lerFiltroSalvo();
    this.carregandoAgenda = true;

    this.atividadeService.listarPorUsuarioNoCaderno(this.usuario.id).pipe(
      finalize(() => this.carregandoAgenda = false)
    ).subscribe({
      next: atividades => {
        this.atividadesCaderno = atividades || [];
        this.filtro = filtroSalvo || (this.atividadesCaderno.length ? 'caderno' : 'todas');
        this.aplicarFiltro();
      },
      error: () => {
        this.atividadesCaderno = [];
        this.filtro = filtroSalvo || 'todas';
        this.aplicarFiltro();
      }
    });
  }

  selecionarFiltro(filtro: FiltroAgenda) {
    if (this.filtro === filtro) return;
    this.filtro = filtro;
    this.secoesExpandidas.clear();
    this.salvarFiltro(filtro);
    this.aplicarFiltro();
  }

  private aplicarFiltro() {
    if (this.filtro === 'todas' && this.atividadesTodas === null) {
      this.carregarTodas();
      return;
    }
    this.montarAgenda();
  }

  private get atividadesAtuais(): AtividadeModel[] {
    return this.filtro === 'caderno' ? this.atividadesCaderno : (this.atividadesTodas || []);
  }

  private carregarNomesSalas() {
    this.salaService.listarPorUsuario(this.usuario.id).subscribe({
      next: salas => {
        this.quantidadeSalas = (salas || []).length;
        (salas || []).forEach(sala => this.nomesSalas[sala.id] = sala.nome);
      },
      error: () => undefined
    });
  }

  /** Busca cada sala do aluno (no máximo 4 ao mesmo tempo) e vai montando a agenda conforme chegam. */
  private carregarTodas() {
    if (this.carregandoTodas) return;

    this.carregandoTodas = true;
    this.atividadesTodas = [];
    const acumuladas = new Map<string, AtividadeModel>();

    this.salaService.listarPorUsuario(this.usuario.id).pipe(
      mergeMap(salas => {
        this.quantidadeSalas = (salas || []).length;
        (salas || []).forEach(sala => this.nomesSalas[sala.id] = sala.nome);
        return from(salas || []);
      }),
      mergeMap(sala => this.salaService.buscarPorId(sala.id, this.usuario.id).pipe(
        catchError(() => of(null))
      ), 4),
      finalize(() => {
        this.carregandoTodas = false;
        if (this.filtro === 'todas') this.montarAgenda();
      })
    ).subscribe({
      next: sala => {
        if (!sala) return;
        (sala.atividades || []).forEach(atividade => {
          atividade.idSala = atividade.idSala || sala.id;
          acumuladas.set(atividade.id, atividade);
        });
        this.atividadesTodas = [...acumuladas.values()];
        if (this.filtro === 'todas') this.montarAgenda();
      },
      error: () => undefined
    });
  }

  /** Separa as atividades pendentes em Atrasadas (últimos 7 dias), Hoje, Amanhã, Esta semana e Depois. */
  private montarAgenda() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const atrasadas: AtividadeModel[] = [];
    const deHoje: AtividadeModel[] = [];
    const amanha: AtividadeModel[] = [];
    const semana: AtividadeModel[] = [];
    const depois: AtividadeModel[] = [];

    for (const atividade of this.atividadesAtuais) {
      if (atividade.status === 'concluido') continue;
      const prazo = parsearData(atividade.dataEntrega);
      if (!prazo) continue;

      const dias = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);
      if (dias < 0) {
        if (dias >= -this.DIAS_ATRASADAS) atrasadas.push(atividade);
      } else if (dias === 0) {
        deHoje.push(atividade);
      } else if (dias === 1) {
        amanha.push(atividade);
      } else if (dias <= 7) {
        semana.push(atividade);
      } else {
        depois.push(atividade);
      }
    }

    const ordenar = (lista: AtividadeModel[]) => lista.sort(compararPorEntrega);
    this.secoes = [
      { chave: 'atrasadas', titulo: 'Atrasadas', atividades: ordenar(atrasadas), alerta: true },
      { chave: 'hoje', titulo: 'Hoje', atividades: ordenar(deHoje) },
      { chave: 'amanha', titulo: 'Amanhã', atividades: ordenar(amanha) },
      { chave: 'semana', titulo: 'Esta semana', atividades: ordenar(semana) }
    ].filter(secao => secao.atividades.length);
    this.atividadesDepois = ordenar(depois);

    // O calendário mostra a mesma fonte escolhida no filtro.
    this.atividadesCalendario = this.atividadesAtuais;
    this.gerarCalendario();
    this.carregarAtividadesDoDia();
  }

  atividadesVisiveis(secao: SecaoAgenda): AtividadeModel[] {
    return this.secoesExpandidas.has(secao.chave)
      ? secao.atividades
      : secao.atividades.slice(0, this.LIMITE_POR_SECAO);
  }

  alternarSecao(chave: string) {
    if (this.secoesExpandidas.has(chave)) {
      this.secoesExpandidas.delete(chave);
    } else {
      this.secoesExpandidas.add(chave);
    }
  }

  get depoisExpandido(): boolean {
    return this.secoesExpandidas.has('depois');
  }

  get agendaCarregando(): boolean {
    return this.carregandoAgenda || (this.filtro === 'todas' && this.carregandoTodas && !(this.atividadesTodas || []).length);
  }

  get cadernoVazio(): boolean {
    return !this.atividadesCaderno.length;
  }

  modoItem(): 'caderno' | 'sala' {
    return this.filtro === 'caderno' ? 'caderno' : 'sala';
  }

  nomeDaSala(atividade: AtividadeModel): string {
    return this.nomesSalas[atividade.idSala] || '';
  }

  private chaveFiltro(): string {
    return `inicioFiltroAgenda:${this.usuario.id}`;
  }

  private lerFiltroSalvo(): FiltroAgenda | null {
    try {
      const valor = localStorage.getItem(this.chaveFiltro());
      return valor === 'caderno' || valor === 'todas' ? valor : null;
    } catch {
      return null;
    }
  }

  private salvarFiltro(filtro: FiltroAgenda) {
    try {
      localStorage.setItem(this.chaveFiltro(), filtro);
    } catch {
      // Sem armazenamento local: a escolha vale só nesta sessão.
    }
  }

  private atualizarIndicadoresCalendario() {
    for (const dia of this.diasCalendario) {
      const data = this.dataParaChave(dia.data);
      const atividades = this.atividadesCalendario.filter(atividade => atividade.dataEntrega === data);
      if (!atividades.length) continue;

      dia.indicador = this.indicadorMaisUrgente(atividades);
      const pendentes = atividades.filter(atividade => atividade.status !== 'concluido').length;
      dia.resumoAtividades = `${atividades.length} atividade${atividades.length === 1 ? '' : 's'}: ${pendentes} pendente${pendentes === 1 ? '' : 's'} e ${atividades.length - pendentes} concluída${atividades.length - pendentes === 1 ? '' : 's'}`;
    }
  }

  private indicadorMaisUrgente(atividades: AtividadeModel[]): DiaCalendario['indicador'] {
    const pendentes = atividades.filter(atividade => atividade.status !== 'concluido');
    if (!pendentes.length) return 'concluida';

    const tipos = pendentes.map(atividade => calcularUrgencia(atividade.dataEntrega, atividade.status));
    return tipos.sort((a, b) => ordemUrgencia(a) - ordemUrgencia(b))[0];
  }

  /** Classe de urgência (mesmo padrão do calendário) pra usar em listas de atividades. */
  classeUrgencia(atividade: AtividadeModel): string {
    return classeUrgencia(atividade.dataEntrega, atividade.status);
  }

  private dataParaChave(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  get resumoDiaSelecionado(): string {
    return this.diasCalendario.find(dia => dia.selecionado)?.resumoAtividades || '';
  }

  carregarUltimaSala() {
    this.ultimaSala = null;

    if (!this.usuario.id) {
      this.carregandoUltimaSala = false;
      return;
    }

    const id = localStorage.getItem(`ultimaSala:${this.usuario.id}`);
    if (!id) {
      this.carregandoUltimaSala = false;
      return;
    }

    this.carregandoUltimaSala = true;
    this.salaService.buscarPorId(id, this.usuario.id).subscribe({
      next: (sala) => {
        this.ultimaSala = sala || null;
        this.carregandoUltimaSala = false;
      },
      error: () => {
        localStorage.removeItem(`ultimaSala:${this.usuario.id}`);
        this.ultimaSala = null;
        this.carregandoUltimaSala = false;
      }
    });
  }

  labelPontos(valor: number | string): string {
    return labelPontos(valor);
  }

  /** Próxima atividade pendente (data de hoje em diante), pra sugerir quando
   * o dia selecionado no calendário não tem nada marcado. */
  get proximaAtividadeSugerida(): AtividadeModel | null {
    const hojeStr = this.dataParaChave(new Date());
    const pendentes = this.atividadesCalendario
      .filter(atividade => atividade.status !== 'concluido' && atividade.dataEntrega && atividade.dataEntrega >= hojeStr)
      .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));

    return pendentes[0] || null;
  }

  irParaAtividade(atividade: AtividadeModel) {
    const [ano, mes, dia] = atividade.dataEntrega.split('-').map(Number);
    this.dataSelecionada = new Date(ano, mes - 1, dia);
    this.dataAtual = new Date(ano, mes - 1, 1);
    this.gerarCalendario();
    this.carregarAtividadesDoDia();
  }
}
