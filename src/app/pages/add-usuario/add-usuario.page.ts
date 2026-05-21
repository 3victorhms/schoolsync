import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, IonItem, IonInput, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { UsuarioModel } from '../../model/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

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

  constructor(private formBuilder: FormBuilder, private toastController: ToastController, private navController: NavController, private usuarioService: UsuarioService) {
    this.usuario = new UsuarioModel();
    this.formGroup = this.formBuilder.group({
      'email': [this.usuario.email, Validators.compose([Validators.required])],
      'senha': [this.usuario.senha, Validators.compose([Validators.required])],
      'nome': [this.usuario.nome, Validators.compose([Validators.required])]
    });
  }

  ngOnInit() {
  }

  salvar() {
    this.usuario.nome = this.formGroup.value.nome;
    this.usuario.email = this.formGroup.value.email;
    this.usuario.senha = this.formGroup.value.senha;
    this.usuarioService.salvar(this.usuario);
    this.exibirMensagem('Registro salvo com sucesso!!!');
    this.navController.navigateBack('/login');
  }

  verificarLogin() {
    let login = this.formGroup.get('login')?.value;

    // Se o serviço retornar TRUE (o login já existe no banco/lista)
    if (this.usuarioService.verificarLogin(login)) {
      this.loginExistente = true; // Bloqueia o botão
      this.exibirMensagem('Login já existe');
    } else {
      this.loginExistente = false; // Libera o botão
    }
  }

  irAutenticar() {
    this.navController.navigateForward('/login');
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present()
  }

}
