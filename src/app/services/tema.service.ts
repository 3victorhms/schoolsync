
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const TEMA_STORAGE_KEY = 'schoolsync:tema';
const TEMA_CLARO_CLASS = 'tema-claro';

// "sistema" acompanha o modo claro/escuro do celular ou do computador
export type ModoTema = 'escuro' | 'claro' | 'sistema';

// mesmos valores de --app-bg do global.scss, pra a status bar nativa
// acompanhar o fundo do app em vez de ficar com a cor padrão do sistema
const COR_FUNDO_ESCURO = '#0f1117';
const COR_FUNDO_CLARO = '#edf2f8';

@Injectable({
  providedIn: 'root'
})
export class TemaService {

  // o sistema avisa quando a pessoa troca o modo do celular/PC; só importa no modo "sistema"
  private readonly sistemaClaro = window.matchMedia('(prefers-color-scheme: light)');

  constructor() {
    this.sistemaClaro.addEventListener('change', () => {
      if (this.modoAtual() === 'sistema') this.aplicarTema(this.sistemaClaro.matches);
    });
  }

  aplicarTemaSalvo() {
    this.definirModo(this.modoAtual(), false);
  }

  // modo escolhido no perfil (padrão: escuro)
  modoAtual(): ModoTema {
    try {
      const salvo = localStorage.getItem(TEMA_STORAGE_KEY);
      return salvo === 'claro' || salvo === 'sistema' ? salvo : 'escuro';
    } catch {
      return 'escuro';
    }
  }

  definirModo(modo: ModoTema, salvar = true) {
    if (salvar) {
      try {
        localStorage.setItem(TEMA_STORAGE_KEY, modo);
      } catch {
        // sem armazenamento local: vale só nesta sessão
      }
    }
    this.aplicarTema(modo === 'sistema' ? this.sistemaClaro.matches : modo === 'claro');
  }

  alternarTema(): boolean {
    const claro = !this.temaClaroAtivo();
    this.definirModo(claro ? 'claro' : 'escuro');
    return claro;
  }

  temaClaroAtivo(): boolean {
    return document.body.classList.contains(TEMA_CLARO_CLASS);
  }

  private aplicarTema(claro: boolean) {
    // basicamente um "if tema === claro"
    document.body.classList.toggle(TEMA_CLARO_CLASS, claro);
    this.sincronizarStatusBar(claro);
  }

  // fora do navegador o plugin não tem efeito nenhum, só sincroniza de verdade no build
  private sincronizarStatusBar(claro: boolean) {
    if (!Capacitor.isNativePlatform()) return;

    // Style.Dark = ícones escuros (fundo claro). Style.Light = ícones claros
    // (fundo escuro). é o oposto do nome do tema do app
    StatusBar.setStyle({ style: claro ? Style.Dark : Style.Light }).catch(() => { });
    StatusBar.setBackgroundColor({ color: claro ? COR_FUNDO_CLARO : COR_FUNDO_ESCURO }).catch(() => { });
  }
}
