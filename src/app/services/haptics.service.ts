// feito com auxílio do Claude
//
// no navegador o plugin não faz nada (por isso o guard isNativePlatform), 
// então é seguro chamar em qualquer lugar sem checar a plataforma manualmente antes.

import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class HapticsService {

  /** Toque leve — seleção, marcar/desmarcar, trocar de aba. */
  leve() {
    this.executar(() => Haptics.impact({ style: ImpactStyle.Light }));
  }

  /** Confirmação de sucesso — concluir atividade, entrar em sala, salvar. */
  sucesso() {
    this.executar(() => Haptics.notification({ type: NotificationType.Success }));
  }

  /** Ação destrutiva — excluir atividade/sala/comentário. */
  aviso() {
    this.executar(() => Haptics.notification({ type: NotificationType.Warning }));
  }

  private executar(acao: () => Promise<void>) {
    if (!Capacitor.isNativePlatform()) return;
    acao().catch(() => { });
  }
}
