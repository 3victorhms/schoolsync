import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DesfazerService {

  /** Mostra um aviso tipo "toast" com um botao de "Desfazer", em HTML/CSS
   * puro (sem depender do ion-toast do Ionic, que tem o mesmo problema de
   * hidratacao do ion-alert - ver ConfirmacaoService). Resolve `true` se a
   * pessoa clicar em "Desfazer" a tempo, `false` se o aviso simplesmente
   * expirar.
   *
   * Importante: quem chama deve fazer a acao de verdade (a exclusao, por
   * exemplo) ANTES de mostrar este aviso, nao depois dele - assim a acao
   * fica persistida imediatamente, e um recarregamento da pagina durante
   * a janela de "Desfazer" nao perde a exclusao. Undo aqui e so pra
   * reverter a acao ja feita (recriar o que foi excluido), nao pra adiar
   * a exclusao. */
  mostrar(mensagem: string, textoAcao: string = 'Desfazer', duracaoMs: number = 4000): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const toast = document.createElement('div');
      toast.className = 'desfazer-toast';
      toast.setAttribute('role', 'status');

      const mensagemEl = document.createElement('span');
      mensagemEl.className = 'desfazer-mensagem';
      mensagemEl.textContent = mensagem;

      const btnDesfazer = document.createElement('button');
      btnDesfazer.type = 'button';
      btnDesfazer.className = 'desfazer-btn';
      btnDesfazer.textContent = textoAcao;

      let finalizado = false;
      let temporizador: ReturnType<typeof setTimeout>;

      const finalizar = (resultado: boolean) => {
        if (finalizado) return;
        finalizado = true;
        clearTimeout(temporizador);
        toast.classList.add('desfazer-toast-saindo');
        setTimeout(() => toast.remove(), 200);
        resolve(resultado);
      };

      btnDesfazer.addEventListener('click', () => finalizar(true));
      temporizador = setTimeout(() => finalizar(false), duracaoMs);

      toast.append(mensagemEl, btnDesfazer);
      document.body.appendChild(toast);
    });
  }

  /** Aviso simples, sem botao de acao - pra confirmacoes que nao tem
   * como ser desfeitas (por exemplo, remover um membro da sala, que so
   * pode voltar com um novo convite). Mesmo HTML/CSS puro do `mostrar`,
   * so que some sozinho sem esperar clique nenhum. */
  mostrarMensagem(mensagem: string, duracaoMs: number = 2500): void {
    const toast = document.createElement('div');
    toast.className = 'desfazer-toast';
    toast.setAttribute('role', 'status');

    const mensagemEl = document.createElement('span');
    mensagemEl.className = 'desfazer-mensagem';
    mensagemEl.textContent = mensagem;

    toast.append(mensagemEl);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('desfazer-toast-saindo');
      setTimeout(() => toast.remove(), 200);
    }, duracaoMs);
  }
}
