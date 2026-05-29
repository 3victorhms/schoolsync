import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonButton } from '@ionic/angular/standalone';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ActivatedRoute } from '@angular/router';
import { ToastController, NavController } from '@ionic/angular';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';

@Component({
  selector: 'app-add-atividade',
  templateUrl: './add-atividade.page.html',
  styleUrls: ['./add-atividade.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonButton, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AddAtividadePage implements OnInit {
  atividade: AtividadeModel;
  usuario: UsuarioModel;
  sala: SalaModel;
  formGroup: FormGroup;
  editando: boolean = false;

  hoje = new Date().toISOString().split('T')[0];
  // O método toISOString() retorna uma cadeia de caracteres (string) simplificada no formato ISO extendido (ISO 8601), 
  // que é sempre 24 ou 27 caracteres de tamanho (YYYY-MM-DDTHH:mm:ss.sssZ ou ±YYYYYY-MM-DDTHH:mm:ss.sssZ, respectivamente). 
  // O fuso horário é sempre o deslocamento zero UTC, como denotado pelo sufixo "Z".
  // https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString

  constructor(
    private formBuilder: FormBuilder, private toastController: ToastController,
    private activatedRoute: ActivatedRoute, private navController: NavController,
    private atividadeService: AtividadeService, private usuarioService: UsuarioService, private salaService: SalaService
  ) {

    this.atividade = new AtividadeModel();
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.sala = new SalaModel();

    this.formGroup = this.formBuilder.group({
      'titulo': ['', Validators.required],
      'descricao': [''],
      'disciplina': ['', Validators.required],
      'valor': ['', Validators.required],
      'dataEntrega': ['', [Validators.required, this.dataMinima()]],
    });
  }


  ngOnInit() { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params['id'];

    if (id) {
      this.editando = true;
      this.atividadeService.buscarPorId(id).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Atividade não encontrada');
          return;
        }
        this.atividade = res;
        this.formGroup.get('titulo')?.setValue(this.atividade.titulo);
        this.formGroup.get('descricao')?.setValue(this.atividade.descricao);
        this.formGroup.get('disciplina')?.setValue(this.atividade.disciplina);
        this.formGroup.get('valor')?.setValue(this.atividade.valor);
        this.formGroup.get('dataEntrega')?.setValue(this.atividade.dataEntrega);
        this.formGroup.get('dataEntrega')?.disable();
      });
    }

    const idSala = this.activatedRoute.snapshot.params['idSala'];

    if (idSala) {
      this.salaService.buscarPorId(idSala).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Sala não encontrada');
          this.navController.navigateBack('/salas');
          return;
        }
        this.sala = res;
        this.atividade.idSala = idSala;
      });
    }
  }
  dataMinima() {
    return (control: any) => {
      const hoje = new Date().toISOString().split('T')[0]; // "2026-05-28"
      return control.value < hoje ? { dataPassada: true } : null;
    };
    // verifica se a data escolhida é anterior a hoje
  }

  salvar() {
    this.atividade.titulo = this.formGroup.get('titulo')?.value;
    this.atividade.descricao = this.formGroup.get('descricao')?.value;
    this.atividade.disciplina = this.formGroup.get('disciplina')?.value;
    this.atividade.valor = this.formGroup.get('valor')?.value;
    this.atividade.dataEntrega = this.formGroup.get('dataEntrega')?.value || this.atividade.dataEntrega;
    this.atividade.criadaPor = this.atividade.criadaPor || this.usuario.id;

    if (this.atividade.id) {
      // edição
      this.atividadeService.salvar(this.atividade).subscribe({
        next: () => {
          this.salaService.sincronizarAtividade(this.atividade);
          this.exibirMensagem('Atividade atualizada com sucesso!');
          this.navController.navigateForward('/atividade/' + this.atividade.id);
        },
        error: () => this.exibirMensagem('Erro ao atualizar atividade.')
      });
    } else {
      // criação
      this.salaService.adicionarAtividade(this.atividade, this.atividadeService).subscribe({
        next: () => {
          this.exibirMensagem('Atividade criada com sucesso!');
          this.navController.navigateForward('/sala/' + this.atividade.idSala);
        },
        error: () => this.exibirMensagem('Erro ao criar atividade.')
      });
    }
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }

}
