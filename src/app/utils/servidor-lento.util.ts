// aviso de servidor acordando. a API tá no plano grátis do render, que desliga o servidor
// depois de um tempo sem uso, e a primeira requisição pode levar até 1 minuto. sem o aviso
// parece que o app travou. mesmo esquema do aviso.util.ts (html/css puro)

import { estaOffline } from './conexao.util';

const ESPERA_PARA_AVISAR_MS = 3000;
const ESPERA_PARA_REFORCAR_MS = 15000;

let pendentes = 0;
let timerAviso: ReturnType<typeof setTimeout> | null = null;
let timerReforco: ReturnType<typeof setTimeout> | null = null;
let banner: HTMLElement | null = null;

function mostrarBanner(texto: string) {
  if (typeof document === 'undefined') return;
  // sem internet o problema não é o servidor dormindo: quem avisa é o conexao.util.ts
  if (estaOffline()) return;
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'servidor-lento';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    const spinner = document.createElement('span');
    spinner.className = 'servidor-lento-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const mensagem = document.createElement('span');
    mensagem.className = 'servidor-lento-texto';
    banner.append(spinner, mensagem);
    document.body.appendChild(banner);
  }
  banner.querySelector('.servidor-lento-texto')!.textContent = texto;
}

function esconderBanner() {
  banner?.remove();
  banner = null;
}

// chamado quando uma requisição à API começa
export function requisicaoIniciada() {
  pendentes++;
  if (pendentes > 1) return;
  timerAviso = setTimeout(
    () => mostrarBanner('Conectando ao servidor…'),
    ESPERA_PARA_AVISAR_MS
  );
  timerReforco = setTimeout(
    () => mostrarBanner('O servidor estava em repouso e está ligando. Isso pode levar até 1 minuto.'),
    ESPERA_PARA_REFORCAR_MS
  );
}

// chamado quando uma requisição à API termina (com sucesso, erro ou cancelada)
export function requisicaoTerminada() {
  pendentes = Math.max(0, pendentes - 1);
  if (pendentes > 0) return;
  if (timerAviso) clearTimeout(timerAviso);
  if (timerReforco) clearTimeout(timerReforco);
  timerAviso = timerReforco = null;
  esconderBanner();
}
