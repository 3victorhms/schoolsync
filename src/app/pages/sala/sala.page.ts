import { Component, OnInit, inject } from '@angular/core';
import { ProgressoTarefasComponent } from 'src/app/components/progresso-tarefas/progresso-tarefas.component';
import { TituloPaginaService } from 'src/app/services/titulo-pagina.service';
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
import { addOutline, peopleOutline, bookOutline, calendarOutline, starOutline, timeOutline, checkmarkCircleOutline, bookmarkOutline, createOutline, trashOutline, logOutOutline, personRemoveOutline, chevronForwardOutline, copyOutline, archiveOutline, personAddOutline, statsChartOutline, schoolOutline, ribbonOutline, shareSocialOutline } from 'ionicons/icons';
import { environment } from 'src/environments/environment';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { DesfazerService } from 'src/app/services/desfazer.service';
import { compararPorEntrega, deveArquivar } from 'src/app/utils/urgencia.util';
import { AtividadeItemComponent } from 'src/app/components/atividade-item/atividade-item.component';
import { HapticsService } from 'src/app/services/haptics.service';
import { ClipboardService } from 'src/app/services/clipboard.service';
import { GrupoService } from 'src/app/services/grupo.service';
import { GrupoModel } from 'src/app/model/grupo.model';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { PeriodoModel } from 'src/app/model/periodo.model';
import { periodoAtual, situacaoPeriodo } from 'src/app/utils/periodo.util';

type AbaSala = 'atividades' | 'grupos' | 'membros';

@Component({
    selector: 'app-sala',
    templateUrl: './sala.page.html',
    styleUrls: ['./sala.page.scss'],
    standalone: true,
    imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonRefresher, IonRefresherContent, IonSpinner, IonItemSliding, IonItem, IonItemOptions, IonItemOption, CommonModule, RouterLink, AtividadeItemComponent, ProgressoTarefasComponent]
})
export class SalaPage implements OnInit {
    // nome da sala/atividade/grupo na aba do navegador (versão web)
    private tituloPagina = inject(TituloPaginaService);


    sala: SalaModel;
    atividades: AtividadeModel[];
    membros: UsuarioModel[];
    usuario: UsuarioModel;
    idSala: string;
    excluindoSala = false;
    removendoMembroId = '';
    transferindoLiderId = '';
    carregando = true;

    // aba selecionada. fica guardada ao abrir um grupo/atividade e voltar
    aba: AbaSala = 'atividades';

    // RN16: mesmo limite da API (MAXIMO_MEMBROS_POR_SALA em SalaService.java)
    readonly LIMITE_MEMBROS = 50;
    private abaInicialAplicada = false;

    // atividades cujo dia de entrega ainda não terminou, da mais urgente para a mais distante
    proximasAtividades: AtividadeModel[] = [];
    quantidadeArquivadas = 0;

    grupos: GrupoModel[] = [];
    carregandoGrupos = true;

    // período em andamento (ou o próximo, no recesso) e quanto falta pra acabar
    get periodoDaVez(): PeriodoModel | null {
        return periodoAtual(this.sala.periodos || []);
    }

    get situacaoPeriodoDaVez(): string {
        const periodo = this.periodoDaVez;
        return periodo ? situacaoPeriodo(periodo) : '';
    }

    constructor(
        private activatedRoute: ActivatedRoute,
        private navController: NavController,
        private confirmacaoService: ConfirmacaoService,
        private desfazerService: DesfazerService,
        private toastController: ToastController,
        private salaService: SalaService,
        private usuarioService: UsuarioService,
        private hapticsService: HapticsService,
        private clipboardService: ClipboardService,
        private grupoService: GrupoService
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
            copyOutline, archiveOutline, personAddOutline, statsChartOutline, schoolOutline, ribbonOutline, shareSocialOutline
        });
    }

    ngOnInit() { }

    ionViewWillEnter() {
        const id = this.activatedRoute.snapshot.params['id'];
        this.idSala = id || '';

        // permite abrir a sala direto numa aba (ex.: voltar de um grupo para "Grupos")
        // só na primeira entrada, para não desfazer a aba que o usuário escolheu depois
        const abaInicial = this.activatedRoute.snapshot.queryParams['aba'];
        if (!this.abaInicialAplicada && (abaInicial === 'atividades' || abaInicial === 'grupos' || abaInicial === 'membros')) {
            this.aba = abaInicial;
        }
        this.abaInicialAplicada = true;

        if (id) {
            this.carregarSala(id);
        } else {
            this.carregando = false;
        }
    }

    carregarSala(id: string, event?: any) {
        this.salaService.buscarPorId(id).pipe(
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
                this.tituloPagina.definir(this.sala.nome);
                this.organizarAtividades();
                this.carregarMembros(this.sala.membros);
                this.carregarGrupos();
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

    get vagasRestantes(): number {
        return Math.max(this.LIMITE_MEMBROS - this.membros.length, 0);
    }

    // percentual de ocupação, para a barrinha da aba Membros
    get ocupacaoPercentual(): number {
        return Math.min(Math.round((this.membros.length / this.LIMITE_MEMBROS) * 100), 100);
    }

    selecionarAba(aba: AbaSala) {
        this.aba = aba;
        this.hapticsService.leve();
    }

    // separa as atividades à vista das arquivadas (regra em deveArquivar, utils/urgencia.util.ts)
    organizarAtividades() {
        this.proximasAtividades = this.sala.atividades
            .filter(atividade => !deveArquivar(atividade))
            .sort(compararPorEntrega);
        this.quantidadeArquivadas = this.sala.atividades.length - this.proximasAtividades.length;
    }

    // grupos da sala dos quais o usuário participa
    carregarGrupos() {
        const idSala = this.idSala || this.sala.id;
        if (!idSala || !this.usuario.id) {
            this.grupos = [];
            this.carregandoGrupos = false;
            return;
        }

        this.grupoService.listarMeusGruposDaSala(idSala).pipe(
            finalize(() => this.carregandoGrupos = false)
        ).subscribe({
            next: (res) => this.grupos = res || [],
            error: () => this.grupos = []
        });
    }

    abrirArquivadas() {
        const idSala = this.idSala || this.sala.id;
        if (!idSala) return;

        this.navController.navigateForward(['/sala', idSala, 'atividades'], { queryParams: { aba: 'arquivadas' } });
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

        this.salaService.sairDaSala(this.sala.id).subscribe({
            next: () => {
                localStorage.removeItem(`ultimaSala:${this.usuario.id}`);
                this.exibirMensagem('Você saiu da sala.');
                this.navController.navigateBack('/tabs/salas');
            },
            error: (erro) => {
                console.error('Erro ao sair da sala:', erro);
                this.exibirMensagem(`Erro ao sair da sala (${erro?.status || 'sem conexão'}).`);
            }
        });
    }

    // o líder passa a liderança pra outro membro e vira um membro comum (aí pode sair da sala ou desativar a conta)
    async tornarLider(membro: UsuarioModel) {
        if (this.transferindoLiderId || !this.sala.id) return;

        const nome = this.nomeMembro(membro);
        const confirmou = await this.confirmacaoService.confirmar(
            'Transferir liderança',
            `Tornar ${nome} líder da sala? Você deixa de ser o líder e não poderá mais editar a sala, as matérias e os períodos.`,
            'Transferir'
        );
        if (!confirmou) return;

        this.transferindoLiderId = membro.id;
        this.salaService.transferirLideranca(this.sala.id, membro.id).pipe(
            finalize(() => this.transferindoLiderId = '')
        ).subscribe({
            next: () => {
                this.hapticsService.sucesso();
                this.exibirMensagem(`${nome} agora é o líder da sala.`);
                this.carregarSala(this.sala.id);
            },
            error: (erro) => {
                this.exibirMensagem(erro?.error?.message || 'Não foi possível transferir a liderança.');
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

        // remove no servidor na hora, sem depender do toast. voltar pra sala precisa de convite,
        // ent aqui n tem desfazer, é só um aviso
        this.salaService.removerMembro(this.sala.id, removido.id).subscribe({
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
                this.exibirMensagem(`Erro ao remover membro (${erro?.status || 'sem conexão'}).`);
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
        this.salaService.excluir(this.sala.id).pipe(
            finalize(() => this.excluindoSala = false)
        ).subscribe({
            next: () => {
                this.exibirMensagem('Sala excluída.');
                this.navController.navigateBack('/tabs/salas');
            },
            error: (erro) => {
                console.error('Erro ao excluir sala:', erro);
                this.exibirMensagem(`Erro ao excluir sala (${erro?.status || 'sem conexão'}).`);
            }
        });
    }

    async copiarCodigo() {
        const copiou = await this.clipboardService.copiar(this.sala.codigoConvite);

        if (!copiou) {
            this.desfazerService.mostrarMensagem('Não foi possível copiar o código.');
            return;
        }

        // aviso em html puro (DesfazerService) pq o ion-toast n aparecia direito no navegador
        this.hapticsService.leve();
        this.desfazerService.mostrarMensagem(`Código ${this.sala.codigoConvite} copiado! Envie para seus colegas entrarem na sala.`, 3000);
    }

    // texto e link do convite (o link abre "Entrar na sala" com o código já preenchido)
    get linkConvite(): string {
        return `${environment.webUrl}/entrar-sala?codigo=${encodeURIComponent(this.sala.codigoConvite)}`;
    }

    // abre o compartilhar do celular (whatsapp, e-mail...). no app usa o @capacitor/share e no
    // navegador o compartilhamento do próprio navegador. se nenhum existir, copia o convite
    async compartilharConvite() {
        const texto = `Entra na sala "${this.sala.nome}" no SchoolSync! Código: ${this.sala.codigoConvite}`;
        try {
            const { Share } = await import('@capacitor/share');
            await Share.share({ title: 'Convite para a sala', text: texto, url: this.linkConvite, dialogTitle: 'Convidar colegas' });
            this.hapticsService.leve();
        } catch (erro: any) {
            // quem fechou a janela de compartilhar não precisa de aviso
            if (String(erro?.message || erro).toLowerCase().includes('cancel')) return;

            const copiou = await this.clipboardService.copiar(`${texto}\n${this.linkConvite}`);
            this.desfazerService.mostrarMensagem(copiou
                ? 'Convite copiado! Cole no grupo da turma.'
                : 'Não foi possível compartilhar o convite.', 3000);
        }
    }

    exibirMensagem(texto: string): void {
        mostrarAviso(texto);
    }
}
