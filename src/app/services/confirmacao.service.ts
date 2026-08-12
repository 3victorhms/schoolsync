import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmacaoService {

  constructor(private alertController: AlertController) { }

  async confirmar(titulo: string, mensagem: string, textoConfirmar: string): Promise<boolean> {
    // No Android, o dialogo do proprio WebView e mais confiavel que o overlay
    // animado do Ionic e nao pode ficar escondido atras da pagina.
    if (Capacitor.isNativePlatform()) {
      return window.confirm(`${titulo}\n\n${mensagem}`);
    }

    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      cssClass: 'app-confirmation-alert',
      animated: false,
      backdropDismiss: false,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: textoConfirmar, role: 'confirm', cssClass: 'alert-button-destructive' }
      ]
    });

    await alert.present();
    const resultado = await alert.onDidDismiss();
    return resultado.role === 'confirm';
  }
}
