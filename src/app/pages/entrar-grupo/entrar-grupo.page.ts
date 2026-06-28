import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
import { GrupoService } from 'src/app/services/grupo.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/model/usuario.model';

@Component({
  selector: 'app-entrar-grupo',
  templateUrl: './entrar-grupo.page.html',
  styleUrls: ['./entrar-grupo.page.scss'],
  standalone: true,
  imports: [IonButton, IonItem, IonBackButton, IonButtons, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EntrarGrupoPage implements OnInit {

  idSala: string;
  usuario: UsuarioModel;
  formGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private toastController: ToastController,
    private grupoService: GrupoService,
    private usuarioService: UsuarioService
  ) {
    this.idSala = '';
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.formGroup = this.formBuilder.group({
      codigoConvite: ['', Validators.compose([Validators.required, Validators.maxLength(20)])],
    });

    addIcons({ personAddOutline });
  }

  ngOnInit() {
    this.idSala = this.activatedRoute.snapshot.params['idSala'];
  }

  entrar() {
    const codigo = (this.formGroup.get('codigoConvite')?.value || '').trim();

    if (!codigo || !this.usuario.id) return;

    this.grupoService.entrar(codigo, this.usuario.id).subscribe({
      next: (grupo) => {
        this.exibirMensagem('Voce entrou no grupo!');
        this.navController.navigateRoot('/grupo/' + grupo.id);
      },
      error: (err) => {
        this.exibirMensagem(err?.error?.message || 'Codigo invalido ou grupo nao encontrado.');
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
