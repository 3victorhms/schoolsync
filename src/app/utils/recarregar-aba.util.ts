// feito com auxílio do Claude
//
// As páginas das abas (/tabs/...) ficam dentro de outro ion-router-outlet.
// Quando o app volta de uma página de fora das abas (ex.: /sala/:id), o Ionic
// dispara o ionViewWillEnter da página das abas, mas NÃO o da aba de dentro,
// então listas como a de Salas ficavam desatualizadas (ex.: após excluir uma sala).
// Este helper recarrega a aba sempre que a URL volta para ela, sem repetir a
// carga quando o ionViewWillEnter também dispara (troca normal de aba).

import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RecarregadorDeAba {
  /** Recarrega agora (ignora chamadas repetidas em menos de 800 ms). */
  executar(): void;
  /** Para de observar a navegação (chamar no ngOnDestroy). */
  encerrar(): void;
}

export function criarRecarregadorDeAba(router: Router, rota: string, recarregar: () => void): RecarregadorDeAba {
  let ultimaCarga = 0;

  const executar = () => {
    const agora = Date.now();
    if (agora - ultimaCarga < 800) return;
    ultimaCarga = agora;
    recarregar();
  };

  const inscricao = router.events.pipe(
    filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
    filter(evento => evento.urlAfterRedirects.split('?')[0] === rota)
  ).subscribe(executar);

  return { executar, encerrar: () => inscricao.unsubscribe() };
}
