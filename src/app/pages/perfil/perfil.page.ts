import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonIcon, IonCard, IonLabel, IonCardContent, IonTabButton, IonTabBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, businessOutline, trophyOutline, personOutline, pencilOutline, logOutOutline, bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline, book } from 'ionicons/icons';
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
    id: this.usuarioService.buscarAutenticacao().id,
    nome: this.usuarioService.buscarAutenticacao().nome,
  };

  get iniciais(): string {
    const nome = this.usuario?.nome?.trim() || '';
    return nome
      .split(' ')
      .filter((p: string) => p.length > 0)
      .map((p: string) => p[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }

  constructor(private router: Router, private usuarioService: UsuarioService, private navController: NavController, private atividadeService: AtividadeService) {
    addIcons({
      book, pencilOutline, homeOutline, businessOutline, trophyOutline, personOutline, logOutOutline, bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline

    });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.usuario = {
      id: this.usuarioService.buscarAutenticacao().id,
      nome: this.usuarioService.buscarAutenticacao().nome,
    };
    this.carregarCaderno();
  }

  carregarCaderno() {
    const usuario = this.usuarioService.buscarAutenticacao();

    if (!usuario.id) {
      this.atividades = [];
      this.atividadesFiltradas = [];
      return;
    }

    this.atividadeService.listarPorUsuarioNoCaderno(usuario.id).subscribe({
      next: (res) => {
        this.atividades = res;
        this.filtrar(this.filtroAtivo);
      },
      error: () => {
        this.atividades = [];
        this.atividadesFiltradas = [];
      }
    });
  }

  filtrar(filtro: string) {
    this.filtroAtivo = filtro;
    if (filtro === 'todas') {
      this.atividadesFiltradas = this.atividades;
    } else {
      this.atividadesFiltradas = this.atividades.filter(a => {
        const status = a.status || 'nao_iniciada';
        return status === filtro;
      });
    }
  }

  iconeStatus(status: string | null): string {
    const s = status || 'nao_iniciada';
    return s === 'concluido' ? 'checkmark-circle-outline' : 'time-outline';
  }

  labelStatus(status: string | null): string {
    const s = status || 'nao_iniciada';
    if (s === 'concluido') return 'Concluído';
    if (s === 'nao_iniciada') return 'Não iniciada';
    return 'Em andamento';
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]}`;
  }

  editarPerfil() {
    this.router.navigate(['usuario']);
  }

  logout() {
    this.usuarioService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }
}
