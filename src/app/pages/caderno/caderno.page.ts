import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonTabBar, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, timeOutline, checkmarkCircleOutline, calendarOutline, peopleOutline, starOutline, homeOutline, businessOutline, book, personOutline, ellipseOutline } from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-caderno',
  templateUrl: './caderno.page.html',
  styleUrls: ['./caderno.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonTabBar, IonLabel, CommonModule, FormsModule, RouterLink]
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
      bookOutline, timeOutline, checkmarkCircleOutline,
      calendarOutline, peopleOutline, starOutline, homeOutline, businessOutline, book, personOutline, ellipseOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregarCaderno();
  }

  statusDoUsuario(status: Record<string, string>): string {
    if (!status) return 'nao_iniciada';
    return status[this.usuario.id] || 'nao_iniciada';
  }

  carregarCaderno() {
    const todas = this.atividadeService.listar();
    this.atividades = todas.filter(a =>
      a.noCaderno && a.noCaderno.some(u => u.id === this.usuario.id)
    );
    this.filtrar(this.filtroAtivo);
  }

  filtrar(filtro: string) {
    this.filtroAtivo = filtro;

    if (filtro === 'todas') {
      this.atividadesFiltradas = this.atividades;
    } else {
      this.atividadesFiltradas = this.atividades.filter(a =>
        this.statusDoUsuario(a.status) === filtro
      );
    }
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

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    if (!ano || !mes || !dia) return data;
    return `${dia}/${mes}/${ano}`;
  }
}