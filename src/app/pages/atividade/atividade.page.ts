import { Component, OnInit, inject } from '@angular/core';
import { TituloPaginaService } from 'src/app/services/titulo-pagina.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { HapticsService } from 'src/app/services/haptics.service';
import { labelPontos } from 'src/app/utils/pontos.util';
import { ComentarioModel } from 'src/app/model/comentario.model';
import { ComentarioService } from 'src/app/services/comentario.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { DesfazerService } from 'src/app/services/desfazer.service';
import { addIcons } from 'ionicons';
import { finalize } from 'rxjs';
import { TarefaModel } from 'src/app/model/tarefa.model';
import { TarefaService } from 'src/app/services/tarefa.service';
import { GrupoService } from 'src/app/services/grupo.service';
import { classeStatus, iconeStatus, labelStatus } from 'src/app/utils/atividade-status.util';
import {
  createOutline,
  calendarOutline,
  peopleOutline,
  starOutline,
  timeOutline,
  checkmarkCircleOutline,
  trashOutline,
  addOutline,
  chatboxOutline,
  lockClosedOutline,
  alertCircleOutline,
  ellipseOutline,
  bookmarkOutline,
  triangleOutline,
  sendOutline,
  returnDownBackOutline,
  closeOutline,
  chevronForwardOutline,
  schoolOutline
} from 'ionicons/icons';
import { NotaModel } from 'src/app/model/nota.model';
import { NotaService } from 'src/app/services/nota.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { hojeIso } from 'src/app/utils/periodo.util';

@Component({
  selector: 'app-atividade',
  templateUrl: './atividade.page.html',
  styleUrls: ['./atividade.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonButton,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class AtividadePage implements OnInit {
    // nome da sala/atividade/grupo na aba do navegador (versão web)
    private tituloPagina = inject(TituloPaginaService);


  atividade: AtividadeModel;
  usuario: UsuarioModel;
  criadorNome: string = '';
  comentarios: ComentarioModel[] = [];
  // só na primeira carga: no "puxar para atualizar" os comentários atuais continuam na tela
  carregandoComentarios = true;
  // comentários vêm de 20 em 20 (os mais recentes primeiro)
  temMaisComentarios = false;
  carregandoAnteriores = false;
  private readonly TAMANHO_COMENTARIOS = 20;
  novoComentario: string = '';
  comentarioRespondendo: ComentarioModel | null = null;
  excluindo = false;
  // ids dos comentários com exclusão em andamento. ficam escondidos mesmo se a lista recarregar
  // antes da exclusão terminar, senão eles voltam quando a pessoa sai e entra na tela
  comentariosExcluindoIds = new Set<string>();
  enviandoComentario = false;
  carregando = true;

  // tarefas de grupo atribuídas ao usuário logado para esta atividade
  minhasTarefas: TarefaModel[] = [];

  // nota que o aluno lançou no boletim pra essa atividade (se tiver)
  minhaNota: NotaModel | null = null;
  // nome de cada grupo do usuário na sala, por id (a tarefa só traz o id do grupo)
  nomesGrupos: Record<string, string> = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private toastController: ToastController,
    private confirmacaoService: ConfirmacaoService,
    private desfazerService: DesfazerService,
    private atividadeService: AtividadeService,
    private usuarioService: UsuarioService,
    private comentarioService: ComentarioService,
    private hapticsService: HapticsService,
    private tarefaService: TarefaService,
    private grupoService: GrupoService,
    private notaService: NotaService
  ) {
    this.atividade = new AtividadeModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    addIcons({
      createOutline,
      calendarOutline,
      peopleOutline,
      starOutline,
      timeOutline,
      checkmarkCircleOutline,
      trashOutline,
      addOutline,
      chatboxOutline,
      lockClosedOutline,
      alertCircleOutline,
      ellipseOutline,
      bookmarkOutline,
      triangleOutline,
      sendOutline,
      returnDownBackOutline,
      closeOutline, schoolOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (id) {
      this.carregarAtividade(id);
    } else {
      this.carregando = false;
    }
  }

  carregarAtividade(id: string, event?: any) {
    this.atividadeService.buscarPorId(id).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: (res) => {
        this.atividade = res;
        this.tituloPagina.definir(res.titulo);
        this.novoComentario = '';
        this.comentarioRespondendo = null;
        this.carregarCriador();
        this.carregarComentarios();
        this.carregarMinhasTarefas();
        this.carregarMinhaNota();
      },
      error: () => {
        this.exibirMensagem('Atividade não encontrada');
        this.navController.navigateBack('/tabs/salas');
      }
    });
  }

  // boletim: busca as notas do aluno na sala e fica com a desta atividade
  carregarMinhaNota() {
    this.minhaNota = null;
    if (!this.atividade.idSala || !(Number(this.atividade.valor) > 0)) return;

    this.notaService.listarDaSala(this.atividade.idSala).subscribe({
      next: (notas) => this.minhaNota = (notas || []).find(nota => nota.idAtividade === this.atividade.id) ?? null,
      error: () => this.minhaNota = null
    });
  }

  // abre o lançamento (ou a edição, se já existir) da nota desta atividade
  abrirMinhaNota() {
    this.navController.navigateForward(['/sala', this.atividade.idSala, 'nota'], {
      queryParams: { atividade: this.atividade.id, origem: 'atividade' }
    });
  }

  // busca as tarefas do usuário e fica só com as desta atividade
  carregarMinhasTarefas() {
    if (!this.usuario.id || !this.atividade.id) return;

    this.tarefaService.listarMinhas().subscribe({
      next: (tarefas) => {
        this.minhasTarefas = (tarefas || []).filter(tarefa => tarefa.idAtividade === this.atividade.id);
        if (this.minhasTarefas.length && this.atividade.idSala) {
          this.carregarNomesGrupos();
        }
      },
      error: () => this.minhasTarefas = []
    });
  }

  private carregarNomesGrupos() {
    this.grupoService.listarMeusGruposDaSala(this.atividade.idSala).subscribe({
      next: (grupos) => {
        this.nomesGrupos = {};
        (grupos || []).forEach(grupo => this.nomesGrupos[grupo.id] = grupo.nome);
      },
      error: () => undefined
    });
  }

  classeStatusTarefa(status: string): string {
    return classeStatus(status);
  }

  iconeStatusTarefa(status: string): string {
    return iconeStatus(status);
  }

  labelStatusTarefa(status: string): string {
    return labelStatus(status);
  }

  atualizar(event: any) {
    const id = this.activatedRoute.snapshot.params['id'];
    if (id) {
      this.carregarAtividade(id, event);
    } else {
      event?.target.complete();
    }
  }

  carregarComentarios() {
    if (!this.atividade.id) {
      this.comentarios = [];
      this.carregandoComentarios = false;
      return;
    }

    this.carregandoComentarios = this.comentarios.length === 0;
    // recarregando (ex.: depois de comentar), pede o mesmo tanto que já estava na tela
    const tamanho = Math.max(this.TAMANHO_COMENTARIOS, this.comentarios.length);
    this.comentarioService.listarPorAtividade(this.atividade.id, tamanho).pipe(
      finalize(() => this.carregandoComentarios = false)
    ).subscribe({
      next: (pagina) => {
        this.comentarios = this.filtrarPendentesExclusao(pagina?.itens || []);
        this.temMaisComentarios = !!pagina?.temMais;
      },
      error: () => {
        this.comentarios = [];
        this.temMaisComentarios = false;
      }
    });
  }

  carregarComentariosAnteriores() {
    const maisAntigo = this.comentarios[0];
    if (!this.atividade.id || !maisAntigo || this.carregandoAnteriores) return;
    this.carregandoAnteriores = true;
    this.comentarioService.listarPorAtividade(this.atividade.id, this.TAMANHO_COMENTARIOS, maisAntigo.dataCriacao).pipe(
      finalize(() => this.carregandoAnteriores = false)
    ).subscribe({
      next: (pagina) => {
        const ids = new Set(this.comentarios.map(c => c.id));
        const anteriores = this.filtrarPendentesExclusao(pagina?.itens || []).filter(c => !ids.has(c.id));
        this.comentarios = [...anteriores, ...this.comentarios];
        this.temMaisComentarios = !!pagina?.temMais;
      },
      error: () => mostrarAviso('Não foi possível carregar os comentários anteriores.')
    });
  }

  // tira da lista os comentários com exclusão pendente, pra n reaparecerem num refresh
  private filtrarPendentesExclusao(lista: ComentarioModel[]): ComentarioModel[] {
    return lista
      .filter(comentario => !this.comentariosExcluindoIds.has(comentario.id))
      .map(comentario => ({
        ...comentario,
        respostas: comentario.respostas.filter(resposta => !this.comentariosExcluindoIds.has(resposta.id))
      }));
  }

  enviarComentario() {
    const texto = this.novoComentario.trim();

    if (this.enviandoComentario || !texto) return;
    this.enviandoComentario = true;

    this.comentarioService.criar(
      this.atividade.id,
      texto,
      this.comentarioRespondendo?.id
    ).pipe(
      finalize(() => this.enviandoComentario = false)
    ).subscribe({
      next: () => {
        this.novoComentario = '';
        this.comentarioRespondendo = null;
        this.carregarComentarios();
      },
      error: () => {
        this.exibirMensagem('Erro ao enviar comentário.');
      }
    });
  }

  responderComentario(comentario: ComentarioModel) {
    this.comentarioRespondendo = comentario;
  }

  cancelarResposta() {
    this.comentarioRespondendo = null;
  }

  async excluirComentario(comentario: ComentarioModel) {
    if (this.comentariosExcluindoIds.has(comentario.id)) return;

    const confirmou = await this.confirmacaoService.confirmar(
      'Excluir comentário',
      'Tem certeza que deseja excluir este comentário?',
      'Excluir'
    );

    if (!confirmou) return;

    const { lista, indice } = this.localizarComentario(comentario.id);
    if (!lista || indice < 0) return;

    const [removido] = lista.splice(indice, 1);
    this.comentariosExcluindoIds.add(removido.id);
    this.hapticsService.leve();

    // exclui no servidor na hora, antes do aviso de desfazer. assim se a pessoa atualizar a página
    // o comentário n volta. o desfazer só cria ele de novo
    this.comentarioService.excluir(removido.id).subscribe({
      next: async () => {
        this.comentariosExcluindoIds.delete(removido.id);

        const desfazer = await this.desfazerService.mostrar('Comentário excluído.');
        if (!desfazer) return;

        this.comentarioService.criar(
          this.atividade.id,
          removido.texto,
          removido.idComentarioPai
        ).subscribe({
          next: (recriado) => {
            recriado.respostas = recriado.respostas || [];
            this.reinserirComentario(recriado, indice);
          },
          error: (erro) => {
            console.error('Erro ao desfazer exclusao do comentario:', erro);
            this.exibirMensagem(`Não foi possível desfazer a exclusão (${erro?.status || 'sem conexão'}).`);
          }
        });
      },
      error: (erro) => {
        console.error('Erro ao excluir comentario:', erro);
        this.comentariosExcluindoIds.delete(removido.id);
        this.reinserirComentario(removido, indice);
        this.exibirMensagem(`Erro ao excluir comentário (${erro?.status || 'sem conexão'}).`);
      }
    });
  }

  private localizarComentario(id: string): { lista: ComentarioModel[] | null; indice: number } {
    const indiceTopo = this.comentarios.findIndex(c => c.id === id);
    if (indiceTopo >= 0) return { lista: this.comentarios, indice: indiceTopo };

    for (const comentario of this.comentarios) {
      const indiceResposta = comentario.respostas.findIndex(r => r.id === id);
      if (indiceResposta >= 0) return { lista: comentario.respostas, indice: indiceResposta };
    }

    return { lista: null, indice: -1 };
  }

  // devolve o comentário pra lista atual (ela pode ter sido recarregada enquanto a exclusão tava pendente)
  private reinserirComentario(comentario: ComentarioModel, indiceOriginal: number) {
    if (comentario.idComentarioPai) {
      const pai = this.comentarios.find(c => c.id === comentario.idComentarioPai);
      if (!pai || pai.respostas.some(r => r.id === comentario.id)) return;

      pai.respostas.splice(Math.min(indiceOriginal, pai.respostas.length), 0, comentario);
      return;
    }

    if (this.comentarios.some(c => c.id === comentario.id)) return;
    this.comentarios.splice(Math.min(indiceOriginal, this.comentarios.length), 0, comentario);
  }

  podeAlterarComentario(comentario: ComentarioModel): boolean {
    return comentario.idUsuario === this.usuario.id;
  }

  iniciaisComentario(nome: string): string {
    if (!nome) return '?';

    return nome.split(' ')
      .slice(0, 2)
      .map(parte => parte[0]?.toUpperCase())
      .join('');
  }

  formatarDataComentario(data: string): string {
    if (!data) return '';

    const dataComentario = new Date(data);

    if (Number.isNaN(dataComentario.getTime())) return '';

    const dia = String(dataComentario.getDate()).padStart(2, '0');
    const mes = String(dataComentario.getMonth() + 1).padStart(2, '0');
    const hora = String(dataComentario.getHours()).padStart(2, '0');
    const minuto = String(dataComentario.getMinutes()).padStart(2, '0');

    return `${dia}/${mes} ${hora}:${minuto}`;
  }

  editar() {
    this.navController.navigateForward('/add-atividade-editar/' + this.atividade.id);
  }

  // quem criou a atividade ou o líder da sala (moderação)
  get podeGerenciar(): boolean {
    return !!this.usuario.id
      && (this.usuario.id === this.atividade.idCriador || this.usuario.id === this.atividade.idLiderSala);
  }

  // o líder mexendo na atividade de outro colega
  get moderando(): boolean {
    return this.podeGerenciar && this.usuario.id !== this.atividade.idCriador;
  }

  async excluir() {
    if (this.excluindo || !this.atividade.id) return;

    const confirmou = await this.confirmacaoService.confirmar(
      'Excluir atividade',
      this.moderando
        ? `Esta atividade foi criada por ${this.criadorNome || 'outro colega'}. Como líder da sala, você pode excluí-la para toda a turma. Continuar?`
        : 'Tem certeza que deseja excluir esta atividade?',
      'Excluir'
    );

    if (confirmou) this.confirmarExclusao();
  }

  private confirmarExclusao() {
    if (this.excluindo || !this.atividade.id) return;

    this.excluindo = true;

    this.atividadeService.excluir(this.atividade.id).pipe(
      finalize(() => this.excluindo = false)
    ).subscribe({
      next: () => {
        this.exibirMensagem('Atividade excluída.');
        this.navController.navigateBack('/sala/' + this.atividade.idSala);
      },
      error: (erro) => {
        console.error('Erro ao excluir atividade:', erro);
        const mensagem = erro?.status === 0
          ? 'Não foi possível conectar ao servidor.'
          : erro?.status === 401 || erro?.status === 403
            ? 'Você não tem permissão para excluir esta atividade.'
            : 'Erro ao excluir atividade.';
        this.exibirMensagem(mensagem);
      }
    });
  }

  carregarCriador() {
    if (!this.atividade.idCriador) {
      this.criadorNome = 'Desconhecido';
      return;
    }

    this.usuarioService.buscarPorId(this.atividade.idCriador)
      .subscribe({
        next: (criador) => {
          this.criadorNome = criador.nome || 'Desconhecido';
        },
        error: () => {
          this.criadorNome = 'Desconhecido';
        }
      });
  }

  get prazoEncerrado(): boolean {
    if (!this.atividade.dataEntrega) return false;

    // no fuso do celular (com toISOString/UTC a de hoje aparecia encerrada depois das 21h)
    return this.atividade.dataEntrega < hojeIso();
  }

  get statusAtual(): string {
    return this.atividade.status || 'nao_iniciada';
  }

  // se tá concluída n mostra "prazo encerrado"
  get concluida(): boolean {
    return !!this.atividade.estaNoCaderno && this.statusAtual === 'concluido';
  }

  get statusPrazo(): string {
    if (this.concluida) return 'concluido';
    if (this.prazoEncerrado) return 'expirada';
    if (!this.atividade.estaNoCaderno) return 'fora_caderno';
    if (this.statusAtual === 'nao_iniciada') return 'naoiniciada';

    return 'andamento';
  }

  get labelPrazo(): string {
    if (this.concluida) return 'Concluído';
    if (this.prazoEncerrado) return 'Prazo encerrado';
    if (!this.atividade.estaNoCaderno) return 'Não está no caderno';
    if (this.statusAtual === 'nao_iniciada') return 'Não iniciada';

    return 'Em andamento';
  }

  get iconePrazo(): string {
    if (this.concluida) return 'checkmark-circle-outline';
    if (this.prazoEncerrado) return 'lock-closed-outline';
    if (!this.atividade.estaNoCaderno) return 'bookmark-outline';
    if (this.statusAtual === 'nao_iniciada') return 'ellipse-outline';

    return 'time-outline';
  }

  async alterarStatus(novoStatus: string) {
    // depois do prazo o status continua editável: quem entregou atrasado precisa poder concluir
    if (!this.atividade.estaNoCaderno) return;
    if (novoStatus === this.statusAtual) return;

    // quem já lançou nota já entregou: confirma antes de tirar o "concluído"
    if (this.statusAtual === 'concluido' && this.minhaNota && !(await this.confirmarApesarDaNota(
      'Você já lançou sua nota desta atividade no boletim. Quer mesmo marcar como não concluída?', 'Marcar mesmo assim'))) {
      return;
    }

    this.atividadeService.alterarStatus(
      this.atividade.id,
      novoStatus
    ).subscribe({
      next: () => {
        this.atividade.status = novoStatus;
        if (novoStatus === 'concluido') {
          this.hapticsService.sucesso();
        } else {
          this.hapticsService.leve();
        }
        this.exibirMensagem('Status atualizado.');
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar status.');
      }
    });
  }

  adicionarNoCaderno() {
    this.atividadeService.adicionarNoCaderno(this.atividade.id).subscribe({
      next: () => {
        this.atividade.estaNoCaderno = true;
        this.atividade.status = 'nao_iniciada';
        this.exibirMensagem('Atividade adicionada ao caderno!');
      },
      error: () => {
        this.exibirMensagem('Erro ao adicionar no caderno.');
      }
    });
  }

  // aviso quando a ação desfaz a conclusão de uma atividade que já tem nota lançada
  private confirmarApesarDaNota(mensagem: string, textoConfirmar: string): Promise<boolean> {
    return this.confirmacaoService.confirmar('Atividade com nota lançada', mensagem, textoConfirmar);
  }

  async removerDoCaderno() {
    if (this.minhaNota && !(await this.confirmarApesarDaNota(
      'Você já lançou sua nota desta atividade. Ela continua no boletim, mas a atividade sai do caderno e deixa de aparecer como concluída.', 'Remover'))) {
      return;
    }

    this.atividadeService.removerDoCaderno(this.atividade.id).subscribe({
      next: () => {
        this.atividade.estaNoCaderno = false;
        this.atividade.status = null;
        this.exibirMensagem('Atividade removida do caderno.');
      },
      error: () => {
        this.exibirMensagem('Erro ao remover do caderno.');
      }
    });
  }

  formatarData(data: string): string {
    if (!data) return '';

    const [ano, mes, dia] = data.split('-');

    const meses = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'
    ];

    return `${dia} de ${meses[parseInt(mes) - 1]}, ${ano}`;
  }

  labelPontos(valor: number | string): string {
    return labelPontos(valor);
  }

  exibirMensagem(texto: string): void {
    mostrarAviso(texto);
  }
}
