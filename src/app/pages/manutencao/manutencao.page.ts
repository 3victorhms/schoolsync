import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { constructOutline, refreshOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { SistemaService } from 'src/app/services/sistema.service';
import { TokenService } from 'src/app/services/token.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';

// aparece quando a API responde 503 de manutenção (servidor.interceptor). confere sozinha a cada
// 30 s e volta pro app quando o admin desliga a manutenção
@Component({
  selector: 'app-manutencao',
  templateUrl: './manutencao.page.html',
  styleUrls: ['./manutencao.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class ManutencaoPage {
  private static readonly INTERVALO_MS = 30000;

  mensagem = 'Estamos fazendo uma manutenção no SchoolSync. Volte daqui a pouco.';
  previsao = '';
  conferindo = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sistemaService: SistemaService,
    private tokenService: TokenService,
    private navController: NavController
  ) {
    addIcons({ constructOutline, refreshOutline });
  }

  ionViewWillEnter(): void {
    this.conferir(false);
    this.timer = setInterval(() => this.conferir(false), ManutencaoPage.INTERVALO_MS);
  }

  ionViewWillLeave(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  conferir(avisar = true): void {
    if (this.conferindo) return;
    this.conferindo = true;
    this.sistemaService.status().pipe(finalize(() => this.conferindo = false)).subscribe({
      next: estado => {
        if (!estado.ativa) {
          this.voltar();
          return;
        }
        this.mensagem = estado.mensagem || this.mensagem;
        this.previsao = estado.previsao || '';
        if (avisar) mostrarAviso('Ainda em manutenção. A gente confere de novo sozinho.');
      },
      error: () => {
        if (avisar) mostrarAviso('Não foi possível falar com o servidor agora.');
      }
    });
  }

  private voltar(): void {
    this.navController.navigateRoot(this.tokenService.estaValido() ? '/tabs/inicio' : '/login');
  }
}
