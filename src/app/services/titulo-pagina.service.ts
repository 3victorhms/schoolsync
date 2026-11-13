import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const NOME_APP = 'SchoolSync';

@Injectable({ providedIn: 'root' })
export class TituloPaginaService extends TitleStrategy {

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.definir(this.buildTitle(snapshot));
  }

  definir(texto?: string | null): void {
    const limpo = (texto || '').trim();
    this.title.setTitle(limpo ? `${limpo} · ${NOME_APP}` : NOME_APP);
  }
}
