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
import { TokenService } from 'src/app/services/token.service';
import { finalize, switchMap } from 'rxjs';

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
  usuarioOriginal: { nome: string; email: string; foto: string } = { nome: '', email: '', foto: '' };
  private imagemSelecionada: File | null = null;
  private previewUrl: string | null = null;
  processandoFoto = false;
  salvando = false;

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
    private loginService: LoginService,
    private tokenService: TokenService
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
    const fotoIgual = (this.usuario.foto || '') === this.usuarioOriginal.foto;
    const semSenha = !novaSenha && !confirmarSenha;

    return nomeIgual && emailIgual && fotoIgual && semSenha;
  }

  ngOnInit() {
    this.usuario = this.usuarioService.buscarAutenticacao();

    this.usuarioOriginal = {
      nome: this.usuario.nome,
      email: this.usuario.email,
      foto: this.usuario.foto || '',
    };

    this.formGroup.patchValue({
      nome: this.usuario.nome,
      email: this.usuario.email,
    });
  }

  async selecionarFoto(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      await this.exibirToast('Escolha um arquivo de imagem.');
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      await this.exibirToast('Escolha uma imagem de no máximo 5 MB.');
      return;
    }

    this.processandoFoto = true;
    try {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = URL.createObjectURL(arquivo);
      this.imagemSelecionada = arquivo;
      this.usuario.foto = this.previewUrl;
    } catch {
      await this.exibirToast('Não foi possível preparar essa imagem. Tente outra foto.');
    } finally {
      this.processandoFoto = false;
    }
  }

  removerFoto(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.imagemSelecionada = null;
    this.usuario.foto = '';
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
    if (this.salvando || !this.formGroup.valid || this.senhasDiferentes) return;

    if (!this.tokenService.estaValido()) {
      this.loginService.encerrarAutenticacao();
      this.exibirToast('Sua sessão expirou. Entre novamente para salvar o perfil.');
      this.navController.navigateRoot('/login');
      return;
    }

    const idUsuarioAutenticado = this.tokenService.extrair().id;
    if (!idUsuarioAutenticado) {
      this.loginService.encerrarAutenticacao();
      this.exibirToast('Sua sessão não foi identificada. Entre novamente para salvar o perfil.');
      this.navController.navigateRoot('/login');
      return;
    }

    this.usuario.id = idUsuarioAutenticado;

    this.salvando = true;

    const { nome, email, senhaAtual, novaSenha } = this.formGroup.value;

    const atualizar = () => {
      this.usuario.nome = nome;
      this.usuario.email = email;
      this.usuario.senha = novaSenha || null as any;

      if (novaSenha) {
        this.usuario.senha = novaSenha;
      }

      const salvarDadosUsuario = () => this.usuarioService.salvar(this.usuario);
      const atualizarFoto = this.imagemSelecionada
        ? this.usuarioService.atualizarImagem(this.usuario.id, this.imagemSelecionada)
        : null;

      (atualizarFoto
        ? atualizarFoto.pipe(
          switchMap(resposta => {
            this.usuario.foto = resposta.foto;
            return salvarDadosUsuario();
          })
        )
        : salvarDadosUsuario()
      ).pipe(finalize(() => {
        this.imagemSelecionada = null;
        this.salvando = false;
      }))
        .subscribe({
          next: (usuarioAtualizado) => {
            this.usuario = usuarioAtualizado;
            this.loginService.registrarAutenticacao(usuarioAtualizado);
            this.navController.navigateForward('/perfil');
          },
          error: (erro) => {
            if (erro?.status === 401 || erro?.status === 403) {
              this.loginService.encerrarAutenticacao();
              this.exibirToast('Sua sessão não foi aceita pelo servidor. Entre novamente e tente salvar a foto.');
              this.navController.navigateRoot('/login');
              return;
            }
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
            this.salvando = false;
            this.exibirToast('Senha atual incorreta.');
          }
        });
    } else {
      atualizar();
    }
  }
}
