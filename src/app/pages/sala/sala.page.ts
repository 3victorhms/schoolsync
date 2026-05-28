import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { addIcons } from 'ionicons';
import { addOutline, peopleOutline, trophyOutline, bookOutline, calendarOutline, starOutline, timeOutline, checkmarkCircleOutline, bookmarkOutline } from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';

@Component({
    selector: 'app-sala',
    templateUrl: './sala.page.html',
    styleUrls: ['./sala.page.scss'],
    standalone: true,
    imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, RouterLink]
})
export class SalaPage implements OnInit {

    sala: SalaModel;
    atividades: AtividadeModel[];
    membros: UsuarioModel[];
    usuario: UsuarioModel;

    constructor(
        private activatedRoute: ActivatedRoute,
        private navController: NavController,
        private toastController: ToastController,
        private salaService: SalaService,
        private usuarioService: UsuarioService,
        private atividadeService: AtividadeService
    ) {
        this.sala = new SalaModel();
        this.atividades = [];
        this.membros = [];
        this.usuario = this.usuarioService.buscarAutenticacao();

        addIcons({ addOutline, peopleOutline, trophyOutline, bookOutline, calendarOutline, starOutline, timeOutline, checkmarkCircleOutline, bookmarkOutline });
    }

    ngOnInit() {
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

    ionViewWillEnter() {
        this.carregarAtividades();
    }

    carregarAtividades() {
        this.atividades = this.atividadeService.listarPorSala(this.sala.id);
    }

    // carregarMembros() {
    //     this.membros = this.usuarioService.listar(this.sala.id);
    // }

    iniciais(nome: string): string {
        if (!nome) return '?';
        return nome.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('');
    }

    iconeStatus(status: string): string {
        switch (status) {
            case 'concluido': return 'checkmark-circle-outline';
            case 'no_caderno': return 'book-outline';
            default: return 'time-outline';
        }
    }

    labelStatus(status: string): string {
        switch (status) {
            case 'concluido': return 'Concluído';
            case 'no_caderno': return 'No caderno';
            default: return 'Em andamento';
        }
    }

    async exibirMensagem(texto: string) {
        const toast = await this.toastController.create({
            message: texto,
            duration: 1500
        });
        toast.present();
    }
}