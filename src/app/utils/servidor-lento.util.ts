import { estaOffline } from './conexao.util';

const ESPERA_PARA_AVISAR_MS = 3000;
const ESPERA_PARA_REFORCAR_MS = 15000;
const ESPERA_PARA_TENTAR_DE_NOVO_MS = 20000;

let pendentes = 0;
let timerAviso: ReturnType<typeof setTimeout> | null = null;
let timerReforco: ReturnType<typeof setTimeout> | null = null;
let timerRetry: ReturnType<typeof setTimeout> | null = null;
let banner: HTMLElement | null = null;

function mostrarBanner(texto: string) {
  if (typeof document === 'undefined') return;
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

function mostrarTentarDeNovo() {
  mostrarBanner('Ainda conectando. Isso pode levar até 1 minuto.');
  if (!banner || banner.querySelector('.servidor-lento-retry')) return;
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'servidor-lento-retry';
  botao.textContent = 'Tentar de novo';
  botao.addEventListener('click', () => window.location.reload());
  banner.querySelector('.servidor-lento-spinner')?.replaceWith(botao);
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
    () => mostrarBanner('Acordando o SchoolSync… Na primeira vez do dia pode levar até 1 minuto.'),
    ESPERA_PARA_REFORCAR_MS
  );
  timerRetry = setTimeout(mostrarTentarDeNovo, ESPERA_PARA_TENTAR_DE_NOVO_MS);
}

// chamado quando uma requisição à API termina (com sucesso, erro ou cancelada)
export function requisicaoTerminada() {
  pendentes = Math.max(0, pendentes - 1);
  if (pendentes > 0) return;
  if (timerAviso) clearTimeout(timerAviso);
  if (timerReforco) clearTimeout(timerReforco);
  if (timerRetry) clearTimeout(timerRetry);
  timerAviso = timerReforco = timerRetry = null;
  esconderBanner();
}
