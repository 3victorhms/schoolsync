import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmacaoService {

  async confirmar(titulo: string, mensagem: string, textoConfirmar: string): Promise<boolean> {
    // no android o dialog nativo do WebView é mais confiável que um overlay em html
    if (Capacitor.isNativePlatform()) {
      return window.confirm(`${titulo}\n\n${mensagem}`);
    }

    return this.confirmarComOverlay(titulo, mensagem, textoConfirmar);
  }

  // versão com um botão só, pra avisos tipo "Entendi"
  async informar(titulo: string, mensagem: string, textoFechar: string = 'Entendi'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      window.alert(`${titulo}\n\n${mensagem}`);
      return;
    }

    await this.confirmarComOverlay(titulo, mensagem, textoFechar, true);
  }

  // dialog de confirmação em html/css puro (.confirmacao-overlay no global.scss). o ion-alert
  // às vezes n carregava no build de produção e o botão ficava sem fazer nada
  private confirmarComOverlay(
    titulo: string,
    mensagem: string,
    textoConfirmar: string,
    somenteInformativo: boolean = false
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirmacao-overlay';

      const card = document.createElement('div');
      card.className = 'confirmacao-card';
      card.setAttribute('role', 'alertdialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-labelledby', 'confirmacao-titulo');
      card.setAttribute('aria-describedby', 'confirmacao-mensagem');

      const tituloEl = document.createElement('h2');
      tituloEl.id = 'confirmacao-titulo';
      tituloEl.className = 'confirmacao-titulo';
      tituloEl.textContent = titulo;

      const mensagemEl = document.createElement('p');
      mensagemEl.id = 'confirmacao-mensagem';
      mensagemEl.className = 'confirmacao-mensagem';
      mensagemEl.textContent = mensagem;

      const botoes = document.createElement('div');
      botoes.className = 'confirmacao-botoes';

      const finalizar = (resultado: boolean) => {
        document.removeEventListener('keydown', aoTeclar);
        overlay.remove();
        resolve(resultado);
      };

      const aoTeclar = (evento: KeyboardEvent) => {
        if (evento.key === 'Escape') finalizar(false);
      };

      const btnConfirmar = document.createElement('button');
      btnConfirmar.type = 'button';
      btnConfirmar.className = somenteInformativo
        ? 'confirmacao-btn confirmacao-btn-cancelar'
        : 'confirmacao-btn confirmacao-btn-confirmar';
      btnConfirmar.textContent = textoConfirmar;
      btnConfirmar.addEventListener('click', () => finalizar(true));

      if (!somenteInformativo) {
        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.className = 'confirmacao-btn confirmacao-btn-cancelar';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.addEventListener('click', () => finalizar(false));
        botoes.appendChild(btnCancelar);
      }

      botoes.appendChild(btnConfirmar);
      document.addEventListener('keydown', aoTeclar);

      card.append(tituloEl, mensagemEl, botoes);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // foco no botão principal pra quem usa teclado ou leitor de tela
      setTimeout(() => btnConfirmar.focus(), 0);
    });
  }
}
