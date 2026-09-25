// Aviso rápido (toast) em HTML/CSS puro, usando o estilo .desfazer-toast do
// global.scss. Substitui o ion-toast, que não aparece de forma confiável no
// navegador. Não precisa de injeção de dependência: pode ser chamado de
// qualquer página ou serviço.

export function mostrarAviso(mensagem: string, duracaoMs: number = 2500): void {
  if (typeof document === 'undefined' || !mensagem) return;

  // Um aviso por vez: o novo substitui o anterior em vez de empilhar.
  document.querySelectorAll('.desfazer-toast.aviso-simples').forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.className = 'desfazer-toast aviso-simples';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

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
