import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DesfazerService {

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
