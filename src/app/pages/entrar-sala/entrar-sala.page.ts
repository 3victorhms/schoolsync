import { finalize } from 'rxjs';
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
import { HapticsService } from 'src/app/services/haptics.service';

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
  entrando = false;

  constructor(
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private navController: NavController,
    private salaService: SalaService,
    private usuarioService: UsuarioService,
    private hapticsService: HapticsService
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
      this.exibirMensagem('Faça login para entrar em uma sala.');
      this.navController.navigateRoot('/login');
      return;
    }

    const codigo: string = (this.formGroup.get('codigoConvite')?.value || '').trim();
    if (this.entrando) return;
    this.entrando = true;

    this.salaService.entrar(codigo, this.usuario.id).pipe(
      finalize(() => this.entrando = false)
    ).subscribe({
      next: (sala) => {
        this.hapticsService.sucesso();
        this.exibirMensagem('Você entrou na sala!');

        if (sala?.id) {
          this.navController.navigateRoot('/sala/' + sala.id);
          return;
        }

        this.navController.navigateRoot('/tabs/salas');
      },
      error: (err) => {
        this.exibirMensagem(err?.error?.message || 'Código inválido ou sala não encontrada.');
      }
    });
  }

  /** O campo tem erro e o usuário já mexeu nele. */
  campoInvalido(campo: string): boolean {
    const controle = this.formGroup.get(campo);
    return !!controle && controle.invalid && (controle.touched || controle.dirty);
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }
}
