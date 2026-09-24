import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {

  /** Retorna true se o texto foi copiado. */
  async copiar(texto: string): Promise<boolean> {
    if (!texto) return false;

    try {
      await Clipboard.write({ string: texto });
      return true;
    } catch {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * A partir do Android 13 o próprio sistema mostra um aviso ao copiar,
   * então o app não precisa exibir o seu toast (evita aviso duplicado).
   */
  sistemaJaAvisaAoCopiar(): boolean {
    if (Capacitor.getPlatform() !== 'android') return false;

    const versao = /Android (\d+)/.exec(navigator.userAgent);
    return !!versao && Number(versao[1]) >= 13;
  }
}
