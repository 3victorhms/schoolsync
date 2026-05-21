import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  peopleOutline,
  documentsOutline,
  chevronForwardOutline,
  logInOutline,
  add,
} from 'ionicons/icons';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';

@Component({
  selector: 'app-sala',
  templateUrl: './sala.page.html',
  styleUrls: ['./sala.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonCard,
    IonCardContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class SalaPage implements OnInit {

  salas: SalaModel[];

  constructor(private formBuilder: FormBuilder, private salaService: SalaService) {
    addIcons({
      businessOutline,
      peopleOutline,
      documentsOutline,
      chevronForwardOutline,
      logInOutline,
      add,
    });

    this.salas = [];
  }

  ngOnInit() {
    this.salas = this.salaService.listarPorUsuario();
  }

  entrarSala() {

  }

  abrirCriarSala() {

  }

}