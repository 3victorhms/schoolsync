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
            this.salaService.buscarPorId(id).subscribe(res => {
                if (!res) {
                    this.exibirMensagem('Sala não encontrada');
                    this.navController.navigateBack('/salas');
                    return;
                }

                this.sala = res;

                localStorage.setItem('ultimaSala', this.sala.id);
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

    statusDoUsuario(status: Record<string, string>): string {
        if (!status) return 'nao_iniciada';
        return status[this.usuario.id] || 'nao_iniciada';
    }

    iconeStatus(status: Record<string, string>): string {
        switch (this.statusDoUsuario(status)) {
            case 'concluido':
                return 'checkmark-circle-outline';
            case 'nao_iniciada':
                return 'ellipse-outline';
            default:
                return 'time-outline';
        }
    }

    labelStatus(status: Record<string, string>): string {
        switch (this.statusDoUsuario(status)) {
            case 'concluido':
                return 'Concluído';
            case 'nao_iniciada':
                return 'Não iniciada';
            default:
                return 'Em andamento';
        }
    }

    estaNoCaderno(atividade: AtividadeModel): boolean {
        return atividade.noCaderno?.some(u => u.id === this.usuario.id) ?? false;
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
                        this.salaService.excluir(this.sala.id);
                        this.exibirMensagem('Sala excluída.');
                        this.navController.navigateBack('/salas');
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