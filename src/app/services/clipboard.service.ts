import { Injectable } from '@angular/core';
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
}
