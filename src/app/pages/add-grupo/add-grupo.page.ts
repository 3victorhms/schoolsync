import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
import { GrupoService } from 'src/app/services/grupo.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { GrupoModel } from 'src/app/model/grupo.model';

@Component({
  selector: 'app-add-grupo',
  templateUrl: './add-grupo.page.html',
  styleUrls: ['./add-grupo.page.scss'],
  standalone: true,
  imports: [IonButton, IonItem, IonBackButton, IonButtons, IonInput, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AddGrupoPage implements OnInit {

  idSala: string;
  idGrupo: string;
  grupo: GrupoModel;
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
    this.idGrupo = '';
    this.grupo = new GrupoModel();
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.formGroup = this.formBuilder.group({
      nome: ['', Validators.required],
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.idSala = this.activatedRoute.snapshot.params['idSala'];
    this.idGrupo = this.activatedRoute.snapshot.params['id'];

    if (this.idGrupo && this.usuario.id) {
      this.carregarGrupo();
    } else {
      this.grupo = new GrupoModel();
      this.formGroup.reset();
    }
  }

  salvar() {
    if (this.formGroup.invalid || !this.usuario.id) return;

    if (this.modoEdicao) {
      this.atualizar();
      return;
    }

    if (!this.idSala) return;

    this.grupoService.criar(
      this.formGroup.get('nome')?.value,
      this.idSala,
      this.usuario.id
    ).subscribe({
      next: (grupo) => {
        this.exibirMensagem('Grupo criado com sucesso!');
        this.navController.navigateRoot('/grupo/' + grupo.id);
      },
      error: () => {
        this.exibirMensagem('Erro ao criar grupo.');
      }
    });
  }

  carregarGrupo() {
    this.grupoService.buscarPorId(this.idGrupo, this.usuario.id).subscribe({
      next: (grupo) => {
        this.grupo = grupo;
        this.idSala = grupo.idSala;
        this.formGroup.patchValue({
          nome: grupo.nome
        });
      },
      error: () => {
        this.exibirMensagem('Grupo nao encontrado.');
        this.navController.navigateBack('/salas');
      }
    });
  }

  atualizar() {
    if (!this.idGrupo || !this.idSala) return;

    this.grupoService.atualizar(
      this.idGrupo,
      this.formGroup.get('nome')?.value,
      this.idSala,
      this.grupo.idCriador || this.usuario.id
    ).subscribe({
      next: (grupo) => {
        this.exibirMensagem('Grupo atualizado com sucesso!');
        this.navController.navigateRoot('/grupo/' + grupo.id + '?refresh=' + Date.now());
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar grupo.');
      }
    });
  }

  get modoEdicao(): boolean {
    return !!this.idGrupo;
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }
}
