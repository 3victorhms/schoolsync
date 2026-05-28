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
  IonCardContent, IonTabButton, IonTabBar, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  peopleOutline,
  documentsOutline,
  chevronForwardOutline,
  logInOutline,
  add, homeOutline, trophyOutline, personOutline,
} from 'ionicons/icons';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';

@Component({
  selector: 'app-salas',
  templateUrl: './salas.page.html',
  styleUrls: ['./salas.page.scss'],
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
    IonTabButton, IonTabBar, IonLabel,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class SalasPage implements OnInit {

  salas: SalaModel[];

  constructor(private formBuilder: FormBuilder, private salaService: SalaService) {
    addIcons({
      businessOutline,
      peopleOutline,
      documentsOutline,
      chevronForwardOutline,
      logInOutline,
      add, homeOutline,
      trophyOutline,
      personOutline,
    });

    this.salas = [];
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.carregarSalas();
  }

  carregarSalas() {
    this.salas = this.salaService.listarPorUsuario();
  }

}