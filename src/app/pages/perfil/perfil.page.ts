import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonIcon, IonCard, IonLabel, IonCardContent, IonTabButton, IonTabBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, businessOutline, trophyOutline, personOutline, pencilOutline } from 'ionicons/icons';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

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

  constructor(private router: Router, private usuarioService: UsuarioService, private navController: NavController) {
    addIcons({
      pencilOutline, homeOutline,
      businessOutline,
      trophyOutline,
      personOutline

    });
  }

  ngOnInit() {
  }

  editarPerfil() {
    this.router.navigate(['usuario']);
  }

  logout() {
    this.usuarioService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }
}