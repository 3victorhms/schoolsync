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
    const nova = this.formGroup.get('novaSenha')?.value;
    const confirmar = this.formGroup.get('confirmarSenha')?.value;
    return !!nova && !!confirmar && nova !== confirmar;
  }

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService
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

  ngOnInit() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.formGroup.patchValue({
      nome: this.usuario.nome,
      email: this.usuario.email,
    });
  }

  salvar() {
    if (!this.formGroup.valid || this.senhasDiferentes) return;

    const { nome, email, senhaAtual, novaSenha } = this.formGroup.value;

    if (novaSenha) {
      const autenticado = this.usuarioService.autenticar(this.usuario.email, senhaAtual);
      if (!autenticado) {
        alert('Senha atual incorreta.');
        return;
      }
      this.usuario.senha = novaSenha;
    }

    this.usuario.nome = nome;
    this.usuario.email = email;

    const usuarioAtualizado = this.usuarioService.salvar(this.usuario);
    this.usuarioService.registrarAutenticacao(usuarioAtualizado);
  }
}