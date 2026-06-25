import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonTabBar,
  IonLabel,
  IonTabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  timeOutline,
  checkmarkCircleOutline,
  calendarOutline,
  starOutline,
  homeOutline,
  businessOutline,
  book,
  personOutline,
  ellipseOutline
} from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-caderno',
  templateUrl: './caderno.page.html',
  styleUrls: ['./caderno.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonTabBar,
    IonTabButton,
    IonLabel,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class CadernoPage implements OnInit {

  usuario: UsuarioModel;
  atividades: AtividadeModel[];
  atividadesFiltradas: AtividadeModel[];
  filtroAtivo: string;

  constructor(
    private usuarioService: UsuarioService,
    private atividadeService: AtividadeService
  ) {
    this.usuario = new UsuarioModel();
    this.atividades = [];
    this.atividadesFiltradas = [];
    this.filtroAtivo = 'todas';

    addIcons({
      bookOutline,
      timeOutline,
      checkmarkCircleOutline,
      calendarOutline,
      starOutline,
      homeOutline,
      businessOutline,
      book,
      personOutline,
      ellipseOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregarCaderno();
  }

  carregarCaderno() {
    if (!this.usuario.id) {
      this.atividades = [];
      this.atividadesFiltradas = [];
      return;
    }

    this.atividadeService.listarPorUsuarioNoCaderno(this.usuario.id).subscribe({
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
      return;
    }

    this.atividadesFiltradas = this.atividades.filter(a =>
      a.status === filtro
    );
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

  classeStatus(status: string | null): string {
    return status || 'nao_iniciada';
  }

  formatarData(data: string): string {
    if (!data) return '';

    const [ano, mes, dia] = data.split('-');

    if (!ano || !mes || !dia) return data;

    return `${dia}/${mes}/${ano}`;
  }
}