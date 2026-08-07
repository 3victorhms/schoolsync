import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ToastController, AlertController } from '@ionic/angular';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { addIcons } from 'ionicons';
import { addOutline, peopleOutline, trophyOutline, bookOutline, calendarOutline, starOutline, timeOutline, checkmarkCircleOutline, bookmarkOutline, createOutline, trashOutline, logOutOutline, personRemoveOutline } from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-sala',
    templateUrl: './sala.page.html',
    styleUrls: ['./sala.page.scss'],
    standalone: true,
    imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, CommonModule, RouterLink]
})
export class SalaPage implements OnInit {

    sala: SalaModel;
    atividades: AtividadeModel[];
    membros: UsuarioModel[];
    usuario: UsuarioModel;
    idSala: string;
    excluindoSala = false;
    removendoMembroId = '';

    constructor(
        private activatedRoute: ActivatedRoute,
        private navController: NavController,
        private alertController: AlertController,
        private toastController: ToastController,
        private salaService: SalaService,
        private usuarioService: UsuarioService
    ) {
        this.sala = new SalaModel();
        this.atividades = [];
        this.membros = [];
        this.usuario = this.usuarioService.buscarAutenticacao();
        this.idSala = '';

        addIcons({
            addOutline, peopleOutline, trophyOutline, bookOutline,
            calendarOutline, starOutline, timeOutline,
            checkmarkCircleOutline, bookmarkOutline,
            createOutline, trashOutline, logOutOutline,
            personRemoveOutline
        });
    }

    ngOnInit() { }

    ionViewWillEnter() {
        const id = this.activatedRoute.snapshot.params['id'];
        this.idSala = id || '';

        if (id) {
            this.salaService.buscarPorId(id, this.usuario.id).subscribe({
                next: (res) => {
                    this.sala = res;
                    this.sala.id = this.sala.id || id;
                    this.sala.membros = this.sala.membros || [];
                    this.sala.atividades = this.sala.atividades || [];
                    this.carregarMembros(this.sala.membros);
                    localStorage.setItem(`ultimaSala:${this.usuario.id}`, this.sala.id);
                },
                error: () => {
                    this.exibirMensagem('Sala não encontrada');
                    this.navController.navigateBack('/salas');
                }
            });
        }
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

    iconeStatus(status: string | null): string {
        switch (status) {
            case 'concluido':
                return 'checkmark-circle-outline';
            case 'nao_iniciada':
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
            case null:
            case undefined:
                return 'Não iniciada';
            default:
                return 'Em andamento';
        }
    }

    labelPontos(valor: number | string): string {
        const pontos = Number(valor);
        return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
    }

    editar() {
        this.navController.navigateForward('/add-sala-editar/' + this.sala.id);
    }

    async sairDaSala() {
        const alert = await this.alertController.create({
            header: 'Sair da sala',
            message: 'Tem certeza que deseja sair desta sala?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Sair',
                    role: 'destructive',
                    handler: () => {
                        this.salaService.sairDaSala(this.sala.id, this.usuario.id).subscribe({
                            next: () => {
                                localStorage.removeItem(`ultimaSala:${this.usuario.id}`);
                                this.exibirMensagem('Voce saiu da sala.');
                                this.navController.navigateBack('/salas');
                            },
                            error: () => {
                                this.exibirMensagem('Erro ao sair da sala.');
                            }
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    async removerMembro(membro: UsuarioModel) {
        const alert = await this.alertController.create({
            header: 'Remover membro',
            message: `Remover ${this.nomeMembro(membro)} desta sala?`,
            backdropDismiss: false,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Remover',
                    role: 'destructive',
                    handler: () => {
                        if (this.removendoMembroId) return;
                        this.removendoMembroId = membro.id;
                        this.exibirMensagem('Removendo membro...');
                        this.salaService.removerMembro(this.sala.id, membro.id, this.usuario.id).subscribe({
                            next: () => {
                                this.membros = this.membros.filter(item => item.id !== membro.id);
                                this.sala.membros = this.sala.membros.filter(item => item.id !== membro.id);

                                if (this.sala.quantidadeMembros && this.sala.quantidadeMembros > 0) {
                                    this.sala.quantidadeMembros--;
                                }

                                this.exibirMensagem('Membro removido da sala.');
                            },
                            error: () => {
                                this.exibirMensagem('Erro ao remover membro.');
                            }
                        }).add(() => this.removendoMembroId = '');
                    }
                }
            ]
        });

        await alert.present();
    }

    async excluir() {
        const alert = await this.alertController.create({
            header: 'Excluir sala',
            message: 'Tem certeza que deseja excluir esta sala?',
            backdropDismiss: false,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Excluir',
                    role: 'destructive',
                    handler: () => {
                        if (this.excluindoSala || !this.sala.id) return;
                        this.excluindoSala = true;
                        this.exibirMensagem('Excluindo sala...');
                        this.salaService.excluir(this.sala.id).pipe(
                            finalize(() => this.excluindoSala = false)
                        ).subscribe({
                            next: () => {
                                this.exibirMensagem('Sala excluída.');
                                this.navController.navigateBack('/salas');
                            },
                            error: () => {
                                this.exibirMensagem('Erro ao excluir sala.');
                            }
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    async exibirMensagem(texto: string) {
        const toast = await this.toastController.create({
            message: texto,
            duration: 1500
        });

        toast.present();
    }
}
