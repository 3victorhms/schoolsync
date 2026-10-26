// título da aba do navegador na versão web. cada rota tem um title fixo no app.routes.ts
// e as telas de sala, atividade e grupo trocam pelo nome do que tá aberto

import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const NOME_APP = 'SchoolSync';

@Injectable({ providedIn: 'root' })
export class TituloPaginaService extends TitleStrategy {

  constructor(private readonly title: Title) {
    super();
  }

  // chamado pelo Angular a cada navegação, com o "title" da rota
  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.definir(this.buildTitle(snapshot));
  }

  // ex.: definir('DS3') deixa a aba como "DS3 · SchoolSync"
  definir(texto?: string | null): void {
    const limpo = (texto || '').trim();
    this.title.setTitle(limpo ? `${limpo} · ${NOME_APP}` : NOME_APP);
  }
}
