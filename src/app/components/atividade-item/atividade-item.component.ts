// feito com auxílio do Claude
//
// Linha de atividade usada nas listas do app (sala, atividades da sala,
// caderno e início), para todas terem o mesmo visual e comportamento.

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  bookmarkOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  ellipseOutline,
  timeOutline
} from 'ionicons/icons';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { classeStatus, iconeStatus, labelStatus } from 'src/app/utils/atividade-status.util';
import { classeUrgencia, rotuloUrgencia } from 'src/app/utils/urgencia.util';
import { formatarDataCurta } from 'src/app/utils/data.util';
import { labelPontos } from 'src/app/utils/pontos.util';

/**
 * - `sala`: o ícone e o status dependem de a atividade estar no caderno do aluno.
 * - `caderno`: a atividade já está no caderno, então sempre mostra o status.
 * - `simples`: ícone de livro e sem status (ex.: lista do dia no Início).
 */
export type ModoAtividadeItem = 'sala' | 'caderno' | 'simples';

@Component({
  selector: 'app-atividade-item',
  templateUrl: './atividade-item.component.html',
  styleUrls: ['./atividade-item.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon]
})
export class AtividadeItemComponent {

  @Input({ required: true }) atividade!: AtividadeModel;
  @Input() modo: ModoAtividadeItem = 'sala';
  /** Desligue em listas de prazos já encerrados (arquivadas). */
  @Input() mostrarUrgencia = true;
  /** Nome da sala, para listas que juntam atividades de várias salas (ex.: agenda do Início). */
  @Input() nomeSala = '';

  constructor() {
    addIcons({
      bookOutline,
      bookmarkOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      ellipseOutline,
      timeOutline
    });
  }

  get mostraStatus(): boolean {
    return this.modo !== 'simples';
  }

  get estaNoCaderno(): boolean {
    return this.modo === 'caderno' || !!this.atividade.estaNoCaderno;
  }

  get classeIcone(): string {
    if (this.modo === 'simples') return 'livro';
    return this.estaNoCaderno ? classeStatus(this.atividade.status) : 'fora_caderno';
  }

  get nomeIcone(): string {
    if (this.modo === 'simples') return 'book-outline';
    return this.estaNoCaderno ? iconeStatus(this.atividade.status) : 'bookmark-outline';
  }

  get textoStatus(): string {
    return this.estaNoCaderno ? labelStatus(this.atividade.status) : 'Não está no caderno';
  }

  get dataFormatada(): string {
    return formatarDataCurta(this.atividade.dataEntrega);
  }

  get classeData(): string {
    return this.mostrarUrgencia ? classeUrgencia(this.atividade.dataEntrega, this.atividade.status) : '';
  }

  get rotulo(): string {
    return this.mostrarUrgencia ? rotuloUrgencia(this.atividade.dataEntrega, this.atividade.status) : '';
  }

  get pontos(): string {
    return labelPontos(this.atividade.valor);
  }
}
