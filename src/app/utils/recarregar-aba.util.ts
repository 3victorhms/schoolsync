// as páginas das abas ficam em outro ion-router-outlet. quando volta de uma página de fora
// (ex.: /sala/:id) o ionic dispara o ionViewWillEnter da página de abas mas n o da aba de dentro,
// ent a lista de salas ficava desatualizada. isso recarrega a aba quando a url volta pra ela

import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RecarregadorDeAba {
  // recarrega agora (ignora chamadas repetidas em menos de 800 ms)
  executar(): void;
  // para de observar a navegação (chamar no ngOnDestroy)
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
