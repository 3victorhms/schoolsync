import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonButton, IonRefresher, IonRefresherContent, IonSpinner, IonItemSliding, IonItem, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { addIcons } from 'ionicons';
import { addOutline, peopleOutline, bookOutline, calendarOutline, starOutline, timeOutline, checkmarkCircleOutline, bookmarkOutline, createOutline, trashOutline, logOutOutline, personRemoveOutline, chevronForwardOutline, copyOutline } from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { DesfazerService } from 'src/app/services/desfazer.service';
import { classeUrgencia, compararPorEntrega, estaArquivada } from 'src/app/utils/urgencia.util';
import { classeStatus, iconeStatus, labelStatus } from 'src/app/utils/atividade-status.util';
import { labelPontos } from 'src/app/utils/pontos.util';
import { HapticsService } from 'src/app/services/haptics.service';
import { ClipboardService } from 'src/app/services/clipboard.service';

@Component({
    selector: 'app-sala',
    templateUrl: './sala.page.html',
    styleUrls: ['./sala.page.scss'],
    standalone: true,
    imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonRefresher, IonRefresherContent, IonSpinner, IonItemSliding, IonItem, IonItemOptions, IonItemOption, CommonModule, RouterLink]
})
export class SalaPage implements OnInit {

    sala: SalaModel;
    atividades: AtividadeModel[];
    membros: UsuarioModel[];
    usuario: UsuarioModel;
    idSala: string;
    excluindoSala = false;
    removendoMembroId = '';
    carregando = true;

    /** Quantas atividades próximas aparecem direto na sala; o resto fica em /sala/:id/atividades. */
    readonly LIMITE_PREVIA = 5;
    previaAtividades: AtividadeModel[] = [];

    constructor(
        private activatedRoute: ActivatedRoute,
        private navController: NavController,
        private confirmacaoService: ConfirmacaoService,
        private desfazerService: DesfazerService,
        private toastController: ToastController,
        private salaService: SalaService,
        private usuarioService: UsuarioService,
        private hapticsService: HapticsService,
        private clipboardService: ClipboardService
    ) {
        this.sala = new SalaModel();
        this.atividades = [];
        this.membros = [];
        this.usuario = this.usuarioService.buscarAutenticacao();
        this.idSala = '';

        addIcons({
            addOutline, peopleOutline, bookOutline,
            calendarOutline, starOutline, timeOutline,
            checkmarkCircleOutline, bookmarkOutline,
            createOutline, trashOutline, logOutOutline,
            personRemoveOutline, chevronForwardOutline,
            copyOutline
        });
    }

    ngOnInit() { }

    ionViewWillEnter() {
        const id = this.activatedRoute.snapshot.params['id'];
        this.idSala = id || '';

        if (id) {
            this.carregarSala(id);
        } else {
            this.carregando = false;
        }
    }

    carregarSala(id: string, event?: any) {
        this.salaService.buscarPorId(id, this.usuario.id).pipe(
            finalize(() => {
                this.carregando = false;
                event?.target.complete();
            })
        ).subscribe({
            next: (res) => {
                this.sala = res;
                this.sala.id = this.sala.id || id;
                this.sala.membros = this.sala.membros || [];
                this.sala.atividades = this.sala.atividades || [];
                this.organizarAtividades();
                this.carregarMembros(this.sala.membros);
                localStorage.setItem(`ultimaSala:${this.usuario.id}`, this.sala.id);
            },
            error: () => {
                this.exibirMensagem('Sala não encontrada');
                this.navController.navigateBack('/tabs/salas');
            }
        });
    }

    atualizar(event: any) {
        const id = this.idSala || this.activatedRoute.snapshot.params['id'];
        if (id) {
            this.carregarSala(id, event);
        } else {
            event?.target.complete();
        }
    }

    /** Separa as próximas atividades (dia de entrega ainda não terminou) e pega as mais urgentes. */
    organizarAtividades() {
        this.previaAtividades = this.sala.atividades
            .filter(atividade => !estaArquivada(atividade.dataEntrega))
            .sort(compararPorEntrega)
            .slice(0, this.LIMITE_PREVIA);
    }

    /** Há atividades que não aparecem na prévia (arquivadas ou além do limite)? */
    get temAtividadesOcultas(): boolean {
        return this.sala.atividades.length > this.previaAtividades.length;
    }

    abrirAtividades() {
        const idSala = this.idSala || this.sala.id;
        if (!idSala) return;

        this.navController.navigateForward(['/sala', idSala, 'atividades']);
    }

    abrirGrupos() {
        const idSala = this.idSala || this.sala.id;

        if (!idSala) {
            this.exibirMensagem('Sala ainda nao carregada.');
            return;
        }

        this.navController.navigateForward('/grupos/' + idSala);
    }

    iniciais(nome: string): string {
        if (!nome) return '?';

        return nome.split(' ')
            .slice(0, 2)
            .map(n => n[0].toUpperCase())
            .join('');
    }

    nomeMembro(membro: UsuarioModel): string {
        return membro?.nome || membro?.email || 'Aluno';
    }

    get liderLogado(): boolean {
        return this.usuario.id === this.sala.idLider;
    }

    podeRemoverMembro(membro: UsuarioModel): boolean {
        return this.liderLogado && membro.id !== this.usuario.id && membro.id !== this.sala.idLider;
    }

    carregarMembros(membros: unknown[]) {
        const membrosNormalizados = membros
            .map(membro => this.normalizarMembro(membro))
            .filter((membro): membro is UsuarioModel => !!membro);

        const idsSemNome = membrosNormalizados
            .filter(membro => membro.id && !membro.nome)
            .map(membro => membro.id);

        if (idsSemNome.length === 0) {
            this.membros = membrosNormalizados;
            return;
        }

        forkJoin(
            idsSemNome.map(id =>
                this.usuarioService.buscarPorId(id).pipe(
                    catchError(() => of(this.criarMembroFallback(id)))
                )
            )
        ).subscribe(usuarios => {
            const usuariosPorId = new Map(usuarios.map(usuario => [usuario.id, usuario]));
            this.membros = membrosNormalizados.map(membro =>
                usuariosPorId.get(membro.id) || membro
            );
        });
    }

    normalizarMembro(membro: unknown): UsuarioModel | null {
        if (!membro) return null;

        if (typeof membro === 'string') {
            return this.criarMembroFallback(membro);
        }

        const dados = membro as Partial<UsuarioModel> & {
            idUsuario?: string;
            nomeUsuario?: string;
        };

        const usuario = new UsuarioModel();
        usuario.id = dados.id || dados.idUsuario || '';
        usuario.nome = dados.nome || dados.nomeUsuario || '';
        usuario.email = dados.email || '';
        usuario.senha = dados.senha || '';
        usuario.foto = dados.foto || '';

        return usuario;
    }

    criarMembroFallback(id: string): UsuarioModel {
        const usuario = new UsuarioModel();
        usuario.id = id;
        return usuario;
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

    /** Classe de urgência (psicologia das cores, mesmo padrão do calendário) pro rótulo de data. */
    classeUrgencia(atividade: AtividadeModel): string {
        return classeUrgencia(atividade.dataEntrega, atividade.status);
    }

    editar() {
        this.navController.navigateForward('/add-sala-editar/' + this.sala.id);
    }

    async sairDaSala() {
        const confirmou = await this.confirmacaoService.confirmar(
            'Sair da sala',
            'Tem certeza que deseja sair desta sala?',
            'Sair'
        );

        if (!confirmou) return;

        this.salaService.sairDaSala(this.sala.id, this.usuario.id).subscribe({
            next: () => {
                localStorage.removeItem(`ultimaSala:${this.usuario.id}`);
                this.exibirMensagem('Voce saiu da sala.');
                this.navController.navigateBack('/tabs/salas');
            },
            error: (erro) => {
                console.error('Erro ao sair da sala:', erro);
                this.exibirMensagem(`Erro ao sair da sala (${erro?.status || 'sem conexao'}).`);
            }
        });
    }

    async removerMembro(membro: UsuarioModel) {
        if (this.removendoMembroId) return;

        const confirmou = await this.confirmacaoService.confirmar(
            'Remover membro',
            `Remover ${this.nomeMembro(membro)} desta sala?`,
            'Remover'
        );

        if (!confirmou) return;

        const indice = this.membros.findIndex(item => item.id === membro.id);
        if (indice < 0) return;

        const [removido] = this.membros.splice(indice, 1);
        this.sala.membros = this.sala.membros.filter(item => item.id !== membro.id);

        if (this.sala.quantidadeMembros && this.sala.quantidadeMembros > 0) {
            this.sala.quantidadeMembros--;
        }

        this.hapticsService.aviso();
        this.removendoMembroId = removido.id;

        // Chama a remocao no servidor imediatamente (sem esperar nenhum
        // toast/desfazer) - do contrario, se o aviso de "Membro removido"
        // depender do ion-toast do Ionic pra disparar a chamada, e esse
        // componente nunca hidratar em producao, a remocao nunca acontece
        // de verdade e o membro "volta" ao atualizar a pagina. Nao tem
        // como desfazer isso automaticamente (reentrar na sala exige um
        // convite), entao aqui e so um aviso informativo.
        this.salaService.removerMembro(this.sala.id, removido.id, this.usuario.id).subscribe({
            next: () => {
                this.removendoMembroId = '';
                this.desfazerService.mostrarMensagem('Membro removido da sala.');
            },
            error: (erro) => {
                console.error('Erro ao remover membro:', erro);
                this.removendoMembroId = '';
                this.membros.splice(indice, 0, removido);
                this.sala.membros = [...this.sala.membros, removido];
                this.sala.quantidadeMembros = (this.sala.quantidadeMembros || 0) + 1;
                this.exibirMensagem(`Erro ao remover membro (${erro?.status || 'sem conexao'}).`);
            }
        });
    }

    async excluir() {
        if (this.excluindoSala || !this.sala.id) return;

        const confirmou = await this.confirmacaoService.confirmar(
            'Excluir sala',
            'Tem certeza que deseja excluir esta sala?',
            'Excluir'
        );

        if (!confirmou) return;

        this.excluindoSala = true;
        this.exibirMensagem('Excluindo sala...');
        this.salaService.excluir(this.sala.id).pipe(
            finalize(() => this.excluindoSala = false)
        ).subscribe({
            next: () => {
                this.exibirMensagem('Sala excluída.');
                this.navController.navigateBack('/tabs/salas');
            },
            error: (erro) => {
                console.error('Erro ao excluir sala:', erro);
                this.exibirMensagem(`Erro ao excluir sala (${erro?.status || 'sem conexao'}).`);
            }
        });
    }

    async copiarCodigo() {
        const copiou = await this.clipboardService.copiar(this.sala.codigoConvite);

        if (!copiou) {
            this.exibirMensagem('Não foi possível copiar o código.');
            return;
        }

        this.hapticsService.leve();
        this.exibirMensagem(`Código ${this.sala.codigoConvite} copiado! Envie para seus colegas entrarem na sala.`);
    }

    async exibirMensagem(texto: string) {
        const toast = await this.toastController.create({
            message: texto,
            duration: 1500
        });

        toast.present();
    }
}
