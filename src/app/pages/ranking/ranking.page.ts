import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonTabButton, IonTabBar, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, businessOutline, trophyOutline, personOutline } from 'ionicons/icons';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonLabel, IonTitle, IonToolbar, IonIcon, IonTabButton, IonTabBar, CommonModule, FormsModule, RouterModule]
})
export class RankingPage implements OnInit {

  constructor(private router: Router) {
    addIcons({
      homeOutline,
      businessOutline,
      trophyOutline,
      personOutline,
    });
  }

  ngOnInit() {
  }

}
