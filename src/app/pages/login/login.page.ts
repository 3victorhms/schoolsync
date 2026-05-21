import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonInput, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { UsuarioModel } from '../../model/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { schoolOutline, arrowForwardOutline } from 'ionicons/icons';
import { RouterModule } from '@angular/router';

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
  login: String;
  senha: String;

  constructor(private formBuilder: FormBuilder, private toastController: ToastController, private navController: NavController, private usuarioService: UsuarioService) {
    this.login = "";
    this.senha = "";
    this.usuario = new UsuarioModel();

    this.formGroup = this.formBuilder.group({
      'login': [this.login, Validators.compose([Validators.required])],
      'senha': [this.senha, Validators.compose([Validators.required])]
    });

    addIcons({
      schoolOutline, arrowForwardOutline
    })

  }

  ngOnInit() {
    this.usuarioService.encerrarAutenticacao();
  }

  autenticar() {
    this.login = this.formGroup.value.login;
    this.senha = this.formGroup.value.senha;

    this.usuario = this.usuarioService.autenticar(this.login, this.senha);

    if (this.usuario && this.usuario.id != "") {
      this.usuarioService.registrarAutenticacao(this.usuario);
      this.navController.navigateBack('/sala');
    } else {
      this.exibirMensagem('Login ou senha inválidos');
    }
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
