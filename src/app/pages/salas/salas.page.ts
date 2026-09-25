import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  documentsOutline,
  chevronForwardOutline,
  logInOutline,
  add, homeOutline, trophyOutline, personOutline, bookOutline
} from 'ionicons/icons';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { finalize } from 'rxjs';
import { criarRecarregadorDeAba } from 'src/app/utils/recarregar-aba.util';

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
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class SalasPage implements OnInit {

  salas: SalaModel[];
  carregando = true;

  constructor(private formBuilder: FormBuilder, private salaService: SalaService) {
    addIcons({
      peopleOutline,
      documentsOutline,
      chevronForwardOutline,
      logInOutline,
      add, homeOutline,
      trophyOutline,
      personOutline,
      bookOutline
    });

    this.salas = [];
  }

  ngOnInit() { }

  /** Recarrega a lista ao voltar para a aba (inclusive vindo de uma sala excluída/renomeada). */
  private recarregador = criarRecarregadorDeAba(inject(Router), '/tabs/salas', () => this.carregarSalas());

  ionViewWillEnter() {
    this.recarregador.executar();
  }

  ngOnDestroy() {
    this.recarregador.encerrar();
  }

  carregarSalas(event?: any) {
    const usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}');

    if (!usuario.id) {
      this.salas = [];
      this.carregando = false;
      event?.target.complete();
      return;
    }

    this.salaService.listarPorUsuario(usuario.id).pipe(
      finalize(() => {
        this.carregando = false;
        event?.target.complete();
      })
    ).subscribe({
      next: (res) => {
        this.salas = res;
      },
      error: () => {
        this.salas = [];
      }
    });
  }

  atualizar(event: any) {
    this.carregarSalas(event);
  }

  quantidadeMembros(sala: SalaModel): number {
    return sala.quantidadeMembros ?? sala.membros?.length ?? 0;
  }

  quantidadeAtividades(sala: SalaModel): number {
    return sala.quantidadeAtividades ?? sala.atividades?.length ?? 0;
  }

}
