import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { LoginGoogleService } from 'src/app/services/login-google.service';
import { LoginService } from 'src/app/services/login.service';
import { NotificacaoPushService } from 'src/app/services/notificacao-push.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';

// botão "Continuar com o Google" do login e do cadastro. some sozinho se o client id n estiver no environment
@Component({
  selector: 'app-botao-google',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    @if (disponivel) {
    <div class="separador" aria-hidden="true"><span>ou</span></div>
    <button type="button" class="botao-google" [disabled]="entrando" (click)="entrar()">
      @if (entrando) { <span class="btn-spinner" aria-hidden="true"></span> Entrando... }
      @else { <ion-icon name="logo-google" aria-hidden="true"></ion-icon> {{ texto }} }
    </button>
    }
  `,
  styleUrls: ['./botao-google.component.scss']
})
export class BotaoGoogleComponent implements OnInit {
  @Input() texto = 'Continuar com o Google';
  entrando = false;

  constructor(
    private loginGoogleService: LoginGoogleService,
    private loginService: LoginService,
    private notificacaoPushService: NotificacaoPushService,
    private navController: NavController,
    private route: ActivatedRoute
  ) {
    addIcons({ logoGoogle });
  }

  get disponivel(): boolean {
    return this.loginGoogleService.disponivel;
  }

  ngOnInit(): void {
    this.loginGoogleService.preparar().catch(erro => console.error('Erro ao preparar o login com Google:', erro));
  }

  async entrar(): Promise<void> {
    if (this.entrando) return;
    this.entrando = true;
    try {
      const resposta = await this.loginGoogleService.entrar();
      this.loginService.registrarAutenticacao({
        ...resposta.usuario,
        senha: '',
        foto: resposta.usuario.foto || '',
        ativo: resposta.usuario.ativo !== false
      });
      void this.notificacaoPushService.sincronizarAposLogin();
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.navController.navigateRoot(returnUrl?.startsWith('/') ? returnUrl : '/tabs/inicio');
    } catch (erro: any) {
      if (this.loginGoogleService.cancelou(erro)) return;
      console.error('Erro no login com Google:', erro);
      mostrarAviso(this.mensagemDeErro(erro), 4500);
    } finally {
      this.entrando = false;
    }
  }

  private mensagemDeErro(erro: any): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) return 'Sem conexão com o servidor. Tente de novo.';
      return erro.error?.message || 'Não foi possível entrar com o Google.';
    }
    return 'Não foi possível entrar com o Google. Tente de novo.';
  }
}
