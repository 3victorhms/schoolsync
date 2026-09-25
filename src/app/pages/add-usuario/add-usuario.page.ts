import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, IonItem, IonInput, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { UsuarioModel } from '../../model/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import { schoolOutline, arrowForwardOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { mostrarAviso } from 'src/app/utils/aviso.util';

@Component({
  selector: 'app-add-usuario',
  templateUrl: './add-usuario.page.html',
  styleUrls: ['./add-usuario.page.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonInput, IonBackButton, IonButtons, IonIcon, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AddUsuarioPage implements OnInit {

  usuario: UsuarioModel;
  formGroup: FormGroup;
  loginExistente: boolean = false;
  salvando = false;
  mostrarSenha = false;

  constructor(private formBuilder: FormBuilder, private toastController: ToastController, private navController: NavController, private usuarioService: UsuarioService) {
    addIcons({ schoolOutline, arrowForwardOutline, eyeOutline, eyeOffOutline });

    this.usuario = new UsuarioModel();
    this.formGroup = this.formBuilder.group({
      'email': [this.usuario.email, Validators.compose([Validators.required, Validators.email])],
      'senha': [this.usuario.senha, Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(72)])],
      'nome': [this.usuario.nome, Validators.compose([Validators.required])]
    });
  }

  ngOnInit() {
  }

  /** Verdadeiro quando o campo é inválido e já foi "tocado" (perdeu o foco
   * ou o usuário tentou enviar o formulário), pra não mostrar erro antes
   * da hora enquanto a pessoa ainda está digitando. */
  campoInvalido(campo: string): boolean {
    const controle = this.formGroup.get(campo);
    return !!controle && controle.invalid && (controle.touched || controle.dirty);
  }

  salvar() {
    if (this.salvando) return;

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.exibirMensagem('Verifique os campos destacados antes de continuar.');
      return;
    }

    this.salvando = true;

    this.usuario.nome = this.formGroup.value.nome;
    this.usuario.email = this.formGroup.value.email;
    this.usuario.senha = this.formGroup.value.senha;

    this.usuarioService.salvar(this.usuario).pipe(
      finalize(() => this.salvando = false)
    ).subscribe({
      next: (resultado) => {
        this.exibirMensagem('Cadastro realizado com sucesso!');
        this.navController.navigateBack('/login');
      },
      error: (erro) => {
        console.error('Erro ao salvar usuário:', erro);
        this.exibirMensagem('Erro ao salvar registro. Tente novamente.');
      }
    });
  }

  verificarLogin() {
    let login = this.formGroup.get('login')?.value;

    if (this.usuarioService.verificarLogin(login)) {
      this.loginExistente = true;
      this.exibirMensagem('Login já existe');
    } else {
      this.loginExistente = false;
    }
  }

  irAutenticar() {
    this.navController.navigateForward('/login');
  }

  exibirMensagem(texto: string): void {
    mostrarAviso(texto);
  }

}
