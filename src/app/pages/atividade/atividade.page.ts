import { Component, OnInit } from '@angular/core';
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
  chevronForwardOutline
} from 'ionicons/icons';

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

  atividade: AtividadeModel;
  usuario: UsuarioModel;
  criadorNome: string = '';
  comentarios: ComentarioModel[] = [];
  /** Só na primeira carga: no "puxar para atualizar" os comentários atuais continuam na tela. */
  carregandoComentarios = true;
  novoComentario: string = '';
  comentarioRespondendo: ComentarioModel | null = null;
  excluindo = false;
  /** IDs de comentarios com exclusao em andamento (aguardando o "Desfazer"
   * ou a resposta do servidor). Ficam escondidos mesmo que a lista seja
   * recarregada antes da exclusao real terminar, senao eles "voltam"
   * quando o usuario sai e entra na tela de novo. */
  comentariosExcluindoIds = new Set<string>();
  enviandoComentario = false;
  carregando = true;

  /** Tarefas de grupo atribuídas ao usuário logado para esta atividade. */
  minhasTarefas: TarefaModel[] = [];
  /** Nome de cada grupo do usuário na sala, por id (a tarefa só traz o id do grupo). */
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
    private grupoService: GrupoService
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
      closeOutline
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
    this.atividadeService.buscarPorId(id, this.usuario.id).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: (res) => {
        this.atividade = res;
        this.novoComentario = '';
        this.comentarioRespondendo = null;
        this.carregarCriador();
        this.carregarComentarios();
        this.carregarMinhasTarefas();
      },
      error: () => {
        this.exibirMensagem('Atividade não encontrada');
        this.navController.navigateBack('/tabs/salas');
      }
    });
  }

  /** Busca as tarefas do usuário e fica só com as desta atividade. */
  carregarMinhasTarefas() {
    if (!this.usuario.id || !this.atividade.id) return;

    this.tarefaService.listarPorUsuario(this.usuario.id).subscribe({
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
    this.grupoService.listarPorSalaEUsuario(this.atividade.idSala, this.usuario.id).subscribe({
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
    this.comentarioService.listarPorAtividade(this.atividade.id).pipe(
      finalize(() => this.carregandoComentarios = false)
    ).subscribe({
      next: (res) => {
        this.comentarios = this.filtrarPendentesExclusao(res || []);
      },
      error: () => {
        this.comentarios = [];
      }
    });
  }

  /** Remove da lista recem-carregada os comentarios que ainda estao com
   * exclusao pendente (dentro da janela do "Desfazer"), pra nao reaparecerem
   * na tela por causa de um refresh antes da exclusao real acontecer. */
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
      this.usuario.id,
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

    // A exclusao de verdade acontece IMEDIATAMENTE, antes de qualquer
    // aviso de "Desfazer" - assim, se a pessoa atualizar a pagina durante
    // a janela de desfazer (ou o aviso nunca aparecer, por qualquer
    // motivo), o comentario ja foi excluido no servidor e nao "volta"
    // depois de um refresh. O "Desfazer" so recria o comentario.
    this.comentarioService.excluir(removido.id, this.usuario.id).subscribe({
      next: async () => {
        this.comentariosExcluindoIds.delete(removido.id);

        const desfazer = await this.desfazerService.mostrar('Comentário excluído.');
        if (!desfazer) return;

        this.comentarioService.criar(
          this.atividade.id,
          removido.texto,
          this.usuario.id,
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

  /** Devolve um comentario removido otimisticamente pra lista atual (que
   * pode ter sido substituida por um recarregamento enquanto a exclusao
   * estava pendente, entao nao da pra confiar na referencia antiga). */
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

  async excluir() {
    if (this.excluindo || !this.atividade.id) return;

    const confirmou = await this.confirmacaoService.confirmar(
      'Excluir atividade',
      'Tem certeza que deseja excluir esta atividade?',
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

    const hoje = new Date().toISOString().split('T')[0];

    return this.atividade.dataEntrega < hoje;
  }

  get statusAtual(): string {
    return this.atividade.status || 'nao_iniciada';
  }

  get statusPrazo(): string {
    if (this.prazoEncerrado) return 'expirada';
    if (!this.atividade.estaNoCaderno) return 'fora_caderno';
    if (this.statusAtual === 'concluido') return 'concluido';
    if (this.statusAtual === 'nao_iniciada') return 'naoiniciada';

    return 'andamento';
  }

  get labelPrazo(): string {
    if (this.prazoEncerrado) return 'Expirada';
    if (!this.atividade.estaNoCaderno) return 'Não está no caderno';
    if (this.statusAtual === 'concluido') return 'Concluído';
    if (this.statusAtual === 'nao_iniciada') return 'Não iniciada';

    return 'Em andamento';
  }

  get iconePrazo(): string {
    if (this.prazoEncerrado) return 'lock-closed-outline';
    if (!this.atividade.estaNoCaderno) return 'bookmark-outline';
    if (this.statusAtual === 'concluido') return 'checkmark-circle-outline';
    if (this.statusAtual === 'nao_iniciada') return 'ellipse-outline';

    return 'time-outline';
  }

  alterarStatus(novoStatus: string) {
    if (this.prazoEncerrado || !this.atividade.estaNoCaderno) return;

    this.atividadeService.alterarStatus(
      this.atividade.id,
      this.usuario.id,
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
    this.atividadeService.adicionarNoCaderno(
      this.atividade.id,
      this.usuario.id
    ).subscribe({
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

  removerDoCaderno() {
    this.atividadeService.removerDoCaderno(
      this.atividade.id,
      this.usuario.id
    ).subscribe({
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

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });

    toast.present();
  }
}
