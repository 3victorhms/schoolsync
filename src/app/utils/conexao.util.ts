// aviso de sem internet. mesmo esquema do servidor-lento.util.ts (html/css puro)

let banner: HTMLElement | null = null;
let iniciado = false;

// true quando o aparelho avisa que está sem rede
export function estaOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function mostrar() {
  if (typeof document === 'undefined' || banner) return;
  banner = document.createElement('div');
  banner.className = 'sem-conexao';
  banner.setAttribute('role', 'alert');
  const ponto = document.createElement('span');
  ponto.className = 'sem-conexao-ponto';
  ponto.setAttribute('aria-hidden', 'true');
  const texto = document.createElement('span');
  texto.textContent = 'Sem conexão com a internet. O que aparece pode estar desatualizado.';
  banner.append(ponto, texto);
  document.body.appendChild(banner);
}

function esconder() {
  banner?.remove();
  banner = null;
}

// liga o aviso: aparece quando a rede cai e some sozinho quando ela volta
export function iniciarMonitorConexao() {
  if (iniciado || typeof window === 'undefined') return;
  iniciado = true;
  window.addEventListener('offline', mostrar);
  window.addEventListener('online', esconder);
  if (estaOffline()) mostrar();
}

// chamado pelo interceptor quando uma requisição falha sem resposta (status 0)
export function falhaDeRede() {
  if (estaOffline()) mostrar();
}
