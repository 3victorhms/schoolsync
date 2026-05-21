import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonIcon, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline } from 'ionicons/icons';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonButton, IonIcon, IonCard, IonCardContent,
    CommonModule,
  ],
})
export class PerfilPage implements OnInit {

  usuario = {
    nome: 'Victor Hugo',
  };

  get iniciais(): string {
    return this.usuario.nome
      .split(' ')
      .map(p => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  constructor(private router: Router) {
    addIcons({ pencilOutline });
  }

  ngOnInit() {
  }

  editarPerfil() {
    this.router.navigate(['usuario']);
  }
}