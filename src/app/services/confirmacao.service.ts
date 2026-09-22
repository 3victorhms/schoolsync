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

    try {
      return await this.confirmarComOverlay(titulo, mensagem, textoConfirmar);
    } catch {
      // Se o overlay do Ionic (ion-alert) nao conseguir aparecer - por
      // exemplo, se o componente nao hidratar a tempo - o botao ficava
      // parecendo travado, sem nenhum retorno visual pro usuario. Cai pro
      // confirm() nativo do navegador em vez de deixar a acao sem resposta.
      return window.confirm(`${titulo}\n\n${mensagem}`);
    }
  }

  /** Cria e apresenta o alerta estilizado do app. Se a criacao/apresentacao
   * nao terminar em alguns segundos (componente do Ionic sem hidratar,
   * por exemplo), rejeita pra quem chamou usar o fallback - mas uma vez
   * que o alerta jah apareceu na tela, espera o usuario responder sem
   * prazo nenhum. */
  private confirmarComOverlay(titulo: string, mensagem: string, textoConfirmar: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let apresentado = false;

      const tempoEsgotado = setTimeout(() => {
        if (!apresentado) {
          reject(new Error('O dialogo de confirmacao nao apareceu a tempo.'));
        }
      }, 4000);

      this.alertController.create({
        header: titulo,
        message: mensagem,
        cssClass: 'app-confirmation-alert',
        animated: false,
        backdropDismiss: false,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: textoConfirmar, role: 'confirm', cssClass: 'alert-button-destructive' }
        ]
      })
        .then(alert => alert.present().then(() => alert))
        .then(alert => {
          apresentado = true;
          clearTimeout(tempoEsgotado);
          return alert.onDidDismiss();
        })
        .then(resultado => resolve(resultado.role === 'confirm'))
        .catch(erro => {
          clearTimeout(tempoEsgotado);
          reject(erro);
        });
    });
  }
}
