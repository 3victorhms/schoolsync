import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonInput, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { UsuarioModel } from '../../model/usuario.model';
import { LoginService } from '../../services/login.service';
import { TokenService } from '../../services/token.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { schoolOutline, arrowForwardOutline } from 'ionicons/icons';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonIcon, IonInput, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit {

  usuario: UsuarioModel;
  formGroup: FormGroup;
  login: string;
  senha: string;

  constructor(private formBuilder: FormBuilder, private toastController: ToastController, private navController: NavController, private loginService: LoginService, private tokenService: TokenService, private route: ActivatedRoute) {
    this.login = "";
    this.senha = "";
    this.usuario = new UsuarioModel();

    this.formGroup = this.formBuilder.group({
      'login': [this.login, Validators.compose([Validators.required, Validators.email])],
      'senha': [this.senha, Validators.compose([Validators.required, Validators.minLength(8)])]
    });

    addIcons({
      schoolOutline, arrowForwardOutline
    })

  }

  ngOnInit() {
    this.loginService.encerrarAutenticacao();
    this.exibirAvisoDeRedirecionamento();
  }

  private async exibirAvisoDeRedirecionamento() {
    const motivo = this.route.snapshot.queryParamMap.get('motivo');
    if (!motivo) return;

    const mensagem = motivo === 'sessao-expirada'
      ? 'Sua sessão expirou. Entre novamente para continuar.'
      : 'Faça login para acessar esta página.';

    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      position: 'top',
      color: 'warning'
    });
    await toast.present();
  }

  autenticar() {
    this.login = this.formGroup.value.login;
    this.senha = this.formGroup.value.senha;

    this.loginService.autenticar({ email: this.login, senha: this.senha })
      .subscribe({
        next: () => {
          const dadosToken = this.tokenService.extrair();
          this.usuario = {
            id: dadosToken.id,
            nome: dadosToken.nome,
            email: dadosToken.email || dadosToken.login || this.login,
            senha: '',
            foto: ''
          };

          if (this.usuario && this.usuario.id != "") {
            this.loginService.registrarAutenticacao(this.usuario);
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            this.navController.navigateRoot(returnUrl?.startsWith('/') ? returnUrl : '/inicio');
          }
        },
        error: () => {
          this.exibirMensagem('Login ou senha inválidos');
        }
      });
  }

  irCadastrar() {
    this.navController.navigateForward('/add-usuario');
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present()
  }
}
