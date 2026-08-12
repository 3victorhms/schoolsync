import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  clipboardOutline,
  chevronForwardOutline,
  listOutline,
  homeOutline,
  businessOutline,
  book,
  personOutline,
  logOutOutline,
  trashOutline,
  createOutline
} from 'ionicons/icons';
import { GrupoModel, MembroGrupoModel } from 'src/app/model/grupo.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { GrupoService } from 'src/app/services/grupo.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { finalize } from 'rxjs';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.page.html',
  styleUrls: ['./grupo.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonTabBar,
    IonTabButton,
    IonLabel,
    CommonModule,
    RouterLink
  ]
})
export class GrupoPage implements OnInit {

  grupo: GrupoModel;
  usuario: UsuarioModel;
  excluindoGrupo = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private grupoService: GrupoService,
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private confirmacaoService: ConfirmacaoService,
    private navController: NavController
  ) {
    this.grupo = new GrupoModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    addIcons({
      clipboardOutline,
      chevronForwardOutline,
      listOutline,
      homeOutline,
      businessOutline,
      book,
      personOutline,
      logOutOutline,
      trashOutline,
      createOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    const idGrupo = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (idGrupo && this.usuario.id) {
      this.carregarGrupo(idGrupo);
    }
  }

  carregarGrupo(idGrupo: string) {
    this.grupoService.buscarPorId(idGrupo, this.usuario.id).subscribe({
      next: (res) => {
        this.grupo = res;
      },
      error: () => {
        this.exibirMensagem('Grupo nao encontrado.');
        this.navController.navigateBack('/salas');
      }
    });
  }

  iniciais(nome: string): string {
    if (!nome) return '?';

    return nome.split(' ')
      .slice(0, 2)
      .map(parte => parte[0]?.toUpperCase())
      .join('');
  }

  nomeMembro(membro: MembroGrupoModel): string {
    return membro?.nomeUsuario || 'Aluno';
  }

  ehLiderGrupo(membro: MembroGrupoModel): boolean {
    return !!membro?.criador || membro?.idUsuario === this.grupo.idCriador;
  }

  labelTarefasAtribuidas(): string {
    const total = this.grupo.tarefas?.length || this.grupo.quantidadeTarefas || 0;

    if (total === 0) return 'Nenhuma tarefa atribuida';
    if (total === 1) return '1 tarefa atribuida';

    return `${total} tarefas atribuidas`;
  }

  copiarCodigo() {
    navigator.clipboard?.writeText(this.grupo.codigoConvite);
    this.exibirMensagem('Codigo copiado.');
  }

  editar() {
    this.navController.navigateForward('/add-grupo-editar/' + this.grupo.id);
  }

  async sair() {
    const confirmou = await this.confirmacaoService.confirmar(
      'Sair do grupo',
      'Tem certeza que deseja sair deste grupo?',
      'Sair'
    );

    if (!confirmou) return;

    this.grupoService.sair(this.grupo.id, this.usuario.id).subscribe({
      next: () => {
        this.exibirMensagem('Voce saiu do grupo.');
        this.navController.navigateRoot('/grupos/' + this.grupo.idSala);
      },
      error: (erro) => {
        console.error('Erro ao sair do grupo:', erro);
        this.exibirMensagem(`Erro ao sair do grupo (${erro?.status || 'sem conexao'}).`);
      }
    });
  }

  async excluir() {
    if (this.excluindoGrupo || !this.grupo.id) return;

    const confirmou = await this.confirmacaoService.confirmar(
      'Excluir grupo',
      'Tem certeza que deseja excluir este grupo?',
      'Excluir'
    );

    if (!confirmou) return;

    this.excluindoGrupo = true;
    this.exibirMensagem('Excluindo grupo...');
    this.grupoService.excluir(this.grupo.id, this.usuario.id).pipe(
      finalize(() => this.excluindoGrupo = false)
    ).subscribe({
      next: () => {
        this.exibirMensagem('Grupo excluido.');
        this.navController.navigateRoot('/grupos/' + this.grupo.idSala);
      },
      error: (erro) => {
        console.error('Erro ao excluir grupo:', erro);
        this.exibirMensagem(`Erro ao excluir grupo (${erro?.status || 'sem conexao'}).`);
      }
    });
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }
}
