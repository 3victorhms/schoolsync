import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons, IonBackButton, IonItem, IonButton } from '@ionic/angular/standalone';
import { ToastController, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logInOutline } from 'ionicons/icons';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';

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
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private navController: NavController,
    private salaService: SalaService,
    private usuarioService: UsuarioService
  ) {
    this.sala = new SalaModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    this.formGroup = this.formBuilder.group({
      codigoConvite: [this.sala.codigoConvite, Validators.compose([Validators.required, Validators.maxLength(20)])],
    });

    addIcons({ logInOutline });
  }

  ngOnInit() {
    this.usuario = this.usuarioService.buscarAutenticacao();
  }

  entrar() {
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (!this.usuario.id) {
      this.exibirMensagem('Faca login para entrar em uma sala.');
      this.navController.navigateRoot('/login');
      return;
    }

    const codigo: string = (this.formGroup.get('codigoConvite')?.value || '').trim();

    this.salaService.entrar(codigo, this.usuario.id).subscribe({
      next: (sala) => {
        this.exibirMensagem('Voce entrou na sala com sucesso!');

        if (sala?.id) {
          this.navController.navigateRoot('/sala/' + sala.id);
          return;
        }

        this.navController.navigateRoot('/salas');
      },
      error: (err) => {
        this.exibirMensagem(err?.error?.message || 'Codigo invalido ou sala nao encontrada.');
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
