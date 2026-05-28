import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons, IonBackButton, IonItem, IonButton } from '@ionic/angular/standalone';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { ToastController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-entrar-sala',
  templateUrl: './entrar-sala.page.html',
  styleUrls: ['./entrar-sala.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons, IonBackButton, IonItem, IonButton, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EntrarSalaPage implements OnInit {
  sala: SalaModel;
  usuario: UsuarioModel;
  formGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder, private toastController: ToastController, private navController: NavController, private salaService: SalaService
  ) {

    this.sala = new SalaModel();
    this.usuario = new UsuarioModel();

    this.formGroup = this.formBuilder.group({
      'codigoConvite': [this.sala.codigoConvite, Validators.compose([Validators.required, Validators.maxLength(6), Validators.minLength(6)])],
    });
  }

  ngOnInit() { }

  entrar() {
    const codigo: string = this.formGroup.get('codigoConvite')?.value;

    this.salaService.entrar(codigo, this.usuario.id).subscribe({
      next: () => {
        this.exibirMensagem('Você entrou na sala com sucesso!');
        this.navController.navigateBack('/salas');
      },
      error: () => {
        this.exibirMensagem('Código inválido ou sala não encontrada.');
      }
    });
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }

}
