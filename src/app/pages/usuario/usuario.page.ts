import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonItem, IonInput,
  IonButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { LoginService } from 'src/app/services/login.service';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.page.html',
  styleUrls: ['./usuario.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonBackButton, IonItem, IonInput,
    IonButton, IonIcon,
    CommonModule, ReactiveFormsModule,
  ],
})
export class UsuarioPage implements OnInit {

  formGroup: FormGroup;
  usuario: UsuarioModel = new UsuarioModel();
  usuarioOriginal: { nome: string; email: string } = { nome: '', email: '' };

  mostrarSenhaAtual = false;
  mostrarNovaSenha = false;
  mostrarConfirmar = false;

  get iniciais(): string {
    const nome = this.formGroup.get('nome')?.value || '';
    return nome
      .split(' ')
      .map((p: string) => p[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }

  get senhasDiferentes(): boolean {
    const nova = this.formGroup.get('novaSenha')?.value || '';
    const confirmar = this.formGroup.get('confirmarSenha')?.value || '';

    if (!nova && !confirmar) {
      return false;
    }

    return nova !== confirmar;
  }

  get senhaAtualObrigatoria(): boolean {
    const novaPreenchida = !!this.formGroup.get('novaSenha')?.value;
    const senhaAtualPreenchida = !!this.formGroup.get('senhaAtual')?.value;
    return novaPreenchida && !senhaAtualPreenchida;
  }

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private navController: NavController,
    private loginService: LoginService
  ) {
    addIcons({ eyeOutline, eyeOffOutline });

    this.formGroup = this.formBuilder.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senhaAtual: [''],
      novaSenha: [''],
      confirmarSenha: [''],
    });
  }

  get semAlteracoes(): boolean {
    const { nome, email, novaSenha, confirmarSenha } = this.formGroup.value;

    const nomeIgual = nome === this.usuarioOriginal.nome;
    const emailIgual = email === this.usuarioOriginal.email;
    const semSenha = !novaSenha && !confirmarSenha;

    return nomeIgual && emailIgual && semSenha;
  }

  ngOnInit() {
    this.usuario = this.usuarioService.buscarAutenticacao();

    this.usuarioOriginal = {
      nome: this.usuario.nome,
      email: this.usuario.email,
    };

    this.formGroup.patchValue({
      nome: this.usuario.nome,
      email: this.usuario.email,
    });
  }

  private async exibirToast(mensagem: string, cor: 'success' | 'danger' = 'danger') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'top',
    });
    await toast.present();
  }

  salvar() {
    if (!this.formGroup.valid || this.senhasDiferentes) return;

    const { nome, email, senhaAtual, novaSenha } = this.formGroup.value;

    const atualizar = () => {
      this.usuario.nome = nome;
      this.usuario.email = email;

      if (novaSenha) {
        this.usuario.senha = novaSenha;
      }

      this.usuarioService.salvar(this.usuario)
        .subscribe({
          next: (usuarioAtualizado) => {
            this.usuario = usuarioAtualizado;
            this.loginService.registrarAutenticacao(usuarioAtualizado);
            this.navController.navigateForward('/perfil');
          },
          error: (erro) => {
            const mensagem = erro?.error?.message || 'Erro ao atualizar usuário.';
            this.exibirToast(mensagem);
          }
        });
    };

    if (novaSenha) {
      this.loginService.autenticar({ email: this.usuario.email, senha: senhaAtual })
        .subscribe({
          next: () => {
            atualizar();
          },
          error: () => {
            this.exibirToast('Senha atual incorreta.');
          }
        });
    } else {
      atualizar();
    }
  }
}
