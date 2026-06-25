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
import { addOutline, peopleOutline, trophyOutline, bookOutline, calendarOutline, starOutline, timeOutline, checkmarkCircleOutline, bookmarkOutline, createOutline, trashOutline } from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { forkJoin, of } from 'rxjs';
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

        addIcons({
            addOutline, peopleOutline, trophyOutline, bookOutline,
            calendarOutline, starOutline, timeOutline,
            checkmarkCircleOutline, bookmarkOutline,
            createOutline, trashOutline
        });
    }

    ngOnInit() { }

    ionViewWillEnter() {
        const id = this.activatedRoute.snapshot.params['id'];

        if (id) {
            this.salaService.buscarPorId(id, this.usuario.id).subscribe({
                next: (res) => {
                    this.sala = res;
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

    editar() {
        this.navController.navigateForward('/add-sala-editar/' + this.sala.id);
    }

    async excluir() {
        const alert = await this.alertController.create({
            header: 'Excluir sala',
            message: 'Tem certeza que deseja excluir esta sala?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Excluir',
                    role: 'destructive',
                    handler: () => {
                        this.salaService.excluir(this.sala.id).subscribe({
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
