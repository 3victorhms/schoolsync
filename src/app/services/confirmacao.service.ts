import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmacaoService {

  async confirmar(titulo: string, mensagem: string, textoConfirmar: string): Promise<boolean> {
    // No Android, o dialogo do proprio WebView e mais confiavel que um
    // overlay em HTML e nao pode ficar escondido atras da pagina.
    if (Capacitor.isNativePlatform()) {
      return window.confirm(`${titulo}\n\n${mensagem}`);
    }

    return this.confirmarComOverlay(titulo, mensagem, textoConfirmar);
  }

  /** Variante somente-informativa (um unico botao), pra avisos que nao
   * precisam de confirmar/cancelar - por exemplo, um erro que so precisa
   * de um "Entendi". */
  async informar(titulo: string, mensagem: string, textoFechar: string = 'Entendi'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      window.alert(`${titulo}\n\n${mensagem}`);
      return;
    }

    await this.confirmarComOverlay(titulo, mensagem, textoFechar, true);
  }

  /** Dialogo de confirmacao feito soh com HTML/CSS puro (ver
   * .confirmacao-overlay no global.scss), sem depender do ion-alert do
   * Ionic - que em alguns builds de producao nunca chega a hidratar,
   * deixando a Promise de confirmacao presa pra sempre e o botao parecendo
   * sem nenhuma acao ao clicar. */
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

      // Foco no botao principal assim que o dialogo aparece, pra quem usa
      // teclado/leitor de tela.
      setTimeout(() => btnConfirmar.focus(), 0);
    });
  }
}
