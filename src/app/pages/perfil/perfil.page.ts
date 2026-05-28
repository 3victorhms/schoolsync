import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonIcon, IonCard, IonLabel, IonCardContent, IonTabButton, IonTabBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, businessOutline, trophyOutline, personOutline, pencilOutline, logOutOutline, bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline } from 'ionicons/icons';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AtividadeService } from 'src/app/services/atividade.service';
import { AtividadeModel } from 'src/app/model/atividade.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonButton, IonIcon, IonCard, IonLabel, IonTabButton, IonCardContent, IonTabBar,
    CommonModule,
    RouterModule,
  ],
})
export class PerfilPage implements OnInit {

  atividades: AtividadeModel[] = [];
  atividadesFiltradas: AtividadeModel[] = [];
  filtroAtivo: string = 'todas';

  usuario = {
    nome: this.usuarioService.buscarAutenticacao().nome,
  };

  get iniciais(): string {
    return this.usuario.nome
      .split(' ')
      .map(p => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  constructor(private router: Router, private usuarioService: UsuarioService, private navController: NavController, private atividadeService: AtividadeService) {
    addIcons({
      pencilOutline, homeOutline, businessOutline, trophyOutline, personOutline, logOutOutline, bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline

    });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.carregarCaderno();
  }

  carregarCaderno() {
    const usuario = this.usuarioService.buscarAutenticacao();
    const todas = this.atividadeService.listar();
    this.atividades = todas.filter(a =>
      a.noCaderno && a.noCaderno.some(u => u.id === usuario.id)
    );
    this.filtrar(this.filtroAtivo);
  }

  filtrar(filtro: string) {
    this.filtroAtivo = filtro;
    if (filtro === 'todas') {
      this.atividadesFiltradas = this.atividades;
    } else {
      this.atividadesFiltradas = this.atividades.filter(a => a.status === filtro);
    }
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]}`;
  }

  iconeStatus(status: string): string {
    return status === 'concluido' ? 'checkmark-circle-outline' : 'time-outline';
  }

  labelStatus(status: string): string {
    return status === 'concluido' ? 'Concluído' : 'Em andamento';
  }

  editarPerfil() {
    this.router.navigate(['usuario']);
  }

  logout() {
    this.usuarioService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }
}