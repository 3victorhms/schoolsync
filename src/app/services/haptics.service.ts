// no navegador o plugin n faz nada (guard isNativePlatform), ent dá pra chamar em qualquer lugar

import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class HapticsService {

  // toque leve: seleção, marcar/desmarcar, trocar de aba
  leve() {
    this.executar(() => Haptics.impact({ style: ImpactStyle.Light }));
  }

  // sucesso: concluir atividade, entrar em sala, salvar
  sucesso() {
    this.executar(() => Haptics.notification({ type: NotificationType.Success }));
  }

  // ação destrutiva: excluir atividade/sala/comentário
  aviso() {
    this.executar(() => Haptics.notification({ type: NotificationType.Warning }));
  }

  private executar(acao: () => Promise<void>) {
    if (!Capacitor.isNativePlatform()) return;
    acao().catch(() => { });
  }
}
