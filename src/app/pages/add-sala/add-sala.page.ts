import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonLabel, IonButton, IonInput } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ToastController, NavController } from '@ionic/angular';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';

@Component({
  selector: 'app-add-sala',
  templateUrl: './add-sala.page.html',
  styleUrls: ['./add-sala.page.scss'],
  standalone: true,
  imports: [IonButton, IonLabel, IonItem, IonBackButton, IonButtons, IonInput, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AddSalaPage implements OnInit {

  sala: SalaModel;
  usuario: UsuarioModel;
  formGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder, private toastController: ToastController,
    private activatedRoute: ActivatedRoute, private navController: NavController,
    private salaService: SalaService, private usuarioService: UsuarioService
  ) {
    this.sala = new SalaModel();
    this.usuario = this.usuarioService.buscarAutenticacao();

    this.formGroup = this.formBuilder.group({
      'nomeSala': [this.sala.nome, Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {
    let id = this.activatedRoute.snapshot.params['id'];

    if (id) {
      this.salaService.buscarPorId(id).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Sala não encontrada');
          return;
        }
        this.sala = res;
        this.formGroup.get('nomeSala')?.setValue(this.sala.nome);
      });
    }
  }

  salvar() {
    this.sala.nome = this.formGroup.get('nomeSala')?.value;
    this.sala.idLider = this.usuario.id;

    this.salaService.salvar(this.sala).subscribe({
      next: () => {
        this.exibirMensagem('Sala criada com sucesso!!!');
        this.navController.navigateBack('/sala');
      },
      error: () => {
        this.exibirMensagem('Erro ao criar sala.');
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