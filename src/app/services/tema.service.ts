import { Injectable } from '@angular/core';

const TEMA_STORAGE_KEY = 'schoolsync:tema';
const TEMA_CLARO_CLASS = 'tema-claro';

@Injectable({
  providedIn: 'root'
})
export class TemaService {

  aplicarTemaSalvo() {
    const temaSalvo = localStorage.getItem(TEMA_STORAGE_KEY);
    this.aplicarTema(temaSalvo === 'claro');
  }

  alternarTema(): boolean {
    const claro = !this.temaClaroAtivo();
    this.aplicarTema(claro);
    localStorage.setItem(TEMA_STORAGE_KEY, claro ? 'claro' : 'escuro');
    return claro;
  }

  temaClaroAtivo(): boolean {
    return document.body.classList.contains(TEMA_CLARO_CLASS);
  }

  private aplicarTema(claro: boolean) {
    document.body.classList.toggle(TEMA_CLARO_CLASS, claro);
  }
}
