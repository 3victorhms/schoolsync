import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonButton, IonToggle } from '@ionic/angular/standalone';
import { AtividadeService } from 'src/app/services/atividade.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ActivatedRoute } from '@angular/router';
import { ToastController, NavController } from '@ionic/angular';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { SalaModel } from 'src/app/model/sala.model';
import { SalaService } from 'src/app/services/sala.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-atividade',
  templateUrl: './add-atividade.page.html',
  styleUrls: ['./add-atividade.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonButton, IonToggle, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AddAtividadePage implements OnInit {
  atividade: AtividadeModel;
  usuario: UsuarioModel;
  sala: SalaModel;
  formGroup: FormGroup;
  editando: boolean = false;
  salvando = false;

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
      'descricao': ['', Validators.required],
      'disciplina': ['', Validators.required],
      'valePontuacao': [true],
      'valor': ['', [Validators.required, Validators.min(0.01), Validators.max(15)]],
      'dataEntrega': ['', [Validators.required, this.dataMinima()]],
    });

    // Ligado por padrão (a maioria das atividades vale ponto). Ao desligar,
    // dispensa o campo "Valor" (fica travado em 0 e sem as validações de
    // obrigatório/mínimo).
    this.formGroup.get('valePontuacao')?.valueChanges.subscribe(valePontuacao => {
      const valorControl = this.formGroup.get('valor');
      if (!valorControl) return;

      if (valePontuacao) {
        valorControl.enable();
        valorControl.setValue('');
        valorControl.setValidators([Validators.required, Validators.min(0.01), Validators.max(15)]);
      } else {
        valorControl.clearValidators();
        valorControl.setValue(0);
        valorControl.disable();
      }
      valorControl.updateValueAndValidity();
    });
  }


  ngOnInit() { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

    if (id) {
      this.editando = true;
      this.atividadeService.buscarPorId(id, this.usuario.id).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Atividade não encontrada');
          return;
        }
        this.atividade = res;
        this.formGroup.get('titulo')?.setValue(this.atividade.titulo);
        this.formGroup.get('descricao')?.setValue(this.atividade.descricao);
        this.formGroup.get('disciplina')?.setValue(this.atividade.disciplina);
        this.formGroup.get('valePontuacao')?.setValue(!!this.atividade.valor);
        this.formGroup.get('valor')?.setValue(this.atividade.valor);
        this.formGroup.get('dataEntrega')?.setValue(this.atividade.dataEntrega);
        this.formGroup.get('dataEntrega')?.disable();
      });
    } else {
      this.editando = false;
      this.atividade = new AtividadeModel();
      // FormGroup.reset() sem argumentos zera TUDO pra null (inclusive
      // "valePontuacao", que precisa voltar pra true) — por isso os valores
      // padrão são passados explicitamente aqui.
      this.formGroup.reset({
        titulo: '',
        descricao: '',
        disciplina: '',
        valePontuacao: true,
        valor: '',
        dataEntrega: ''
      });
      this.formGroup.get('dataEntrega')?.enable();
    }

    const idSala = this.activatedRoute.snapshot.params['idSala'];

    if (idSala) {
      this.salaService.buscarPorId(idSala, this.usuario.id).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Sala não encontrada');
          this.navController.navigateBack('/tabs/salas');
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

  /** Verdadeiro quando o campo é inválido e já foi "tocado" (perdeu o foco
   * ou o usuário tentou salvar), pra não mostrar erro antes da hora
   * enquanto a pessoa ainda está preenchendo o formulário. */
  campoInvalido(campo: string): boolean {
    const controle = this.formGroup.get(campo);
    return !!controle && controle.invalid && (controle.touched || controle.dirty);
  }

  salvar() {
    if (this.salvando) return;

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.exibirMensagem('Verifique os campos destacados antes de continuar.');
      return;
    }

    this.salvando = true;

    this.atividade.titulo = this.formGroup.get('titulo')?.value;
    this.atividade.descricao = this.formGroup.get('descricao')?.value;
    this.atividade.disciplina = this.formGroup.get('disciplina')?.value;
    this.atividade.valor = this.formGroup.get('valor')?.value;
    this.atividade.dataEntrega = this.formGroup.get('dataEntrega')?.value || this.atividade.dataEntrega;
    this.atividade.idCriador = this.atividade.idCriador || this.usuario.id;

    if (this.atividade.id) {
      // edição
      this.atividadeService.salvar(this.atividade).pipe(
        finalize(() => this.salvando = false)
      ).subscribe({
        next: () => {
          this.exibirMensagem('Atividade atualizada com sucesso!');
          this.navController.navigateRoot('/atividade/' + this.atividade.id + '?refresh=' + Date.now());
        },
        error: erro => this.exibirMensagem(this.mensagemErroAcademico(erro, 'Erro ao atualizar atividade.'))
      });
    } else {
      // criação
      this.atividadeService.salvar(this.atividade).pipe(
        finalize(() => this.salvando = false)
      ).subscribe({
        next: () => {
          this.exibirMensagem('Atividade criada com sucesso!');
          this.navController.navigateRoot('/sala/' + this.atividade.idSala);
        },
        error: erro => this.exibirMensagem(this.mensagemErroAcademico(erro, 'Erro ao criar atividade.'))
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

  private mensagemErroAcademico(erro: any, padrao: string): string {
    return erro?.error?.message || erro?.error?.detail || erro?.message || padrao;
  }

}
