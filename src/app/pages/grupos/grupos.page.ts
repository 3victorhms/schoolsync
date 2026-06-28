import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  personAddOutline,
  peopleOutline,
  chevronForwardOutline,
  homeOutline,
  businessOutline,
  book,
  personOutline
} from 'ionicons/icons';
import { GrupoModel } from 'src/app/model/grupo.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { GrupoService } from 'src/app/services/grupo.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-grupos',
  templateUrl: './grupos.page.html',
  styleUrls: ['./grupos.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonTabBar,
    IonTabButton,
    IonLabel,
    CommonModule,
    RouterLink
  ]
})
export class GruposPage implements OnInit {

  idSala: string;
  usuario: UsuarioModel;
  grupos: GrupoModel[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private grupoService: GrupoService,
    private usuarioService: UsuarioService
  ) {
    this.idSala = '';
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.grupos = [];

    addIcons({
      addOutline,
      personAddOutline,
      peopleOutline,
      chevronForwardOutline,
      homeOutline,
      businessOutline,
      book,
      personOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.idSala = this.activatedRoute.snapshot.params['idSala'];
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregarGrupos();
  }

  carregarGrupos() {
    if (!this.idSala || !this.usuario.id) {
      this.grupos = [];
      return;
    }

    this.grupoService.listarPorSalaEUsuario(this.idSala, this.usuario.id).subscribe({
      next: (res) => {
        this.grupos = res;
      },
      error: () => {
        this.grupos = [];
      }
    });
  }
}
