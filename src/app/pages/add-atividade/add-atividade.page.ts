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
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { PeriodoModel } from 'src/app/model/periodo.model';
import { MateriaModel } from 'src/app/model/materia.model';
import { formatarDataBr, periodoDaData } from 'src/app/utils/periodo.util';

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
      'idMateria': ['', Validators.required],
      'valePontuacao': [true],
      'valor': ['', [Validators.required, Validators.min(0.01), Validators.max(15), this.cabeNoPeriodo()]],
      'dataEntrega': ['', [Validators.required, this.dataMinima(), this.dentroDosPeriodos()]],
    });

    // O limite de pontos depende da matéria e do período (que sai da data):
    // quando um dos dois muda, o valor precisa ser validado de novo.
    this.formGroup.get('idMateria')?.valueChanges.subscribe(() => this.revalidarValor());
    this.formGroup.get('dataEntrega')?.valueChanges.subscribe(() => this.revalidarValor());

    // Ligado por padrão (a maioria das atividades vale ponto). Ao desligar,
    // dispensa o campo "Valor" (fica travado em 0 e sem as validações de
    // obrigatório/mínimo).
    this.formGroup.get('valePontuacao')?.valueChanges.subscribe(valePontuacao => {
      const valorControl = this.formGroup.get('valor');
      if (!valorControl) return;

      if (valePontuacao) {
        valorControl.enable();
        valorControl.setValue('');
        valorControl.setValidators([Validators.required, Validators.min(0.01), Validators.max(15), this.cabeNoPeriodo()]);
      } else {
        valorControl.clearValidators();
        valorControl.setValue(0);
        valorControl.disable();
      }
      valorControl.updateValueAndValidity();
    });
  }


  /** O líder da sala editando a atividade de outro colega (moderação). */
  get editandoComoLider(): boolean {
    return this.editando && !!this.atividade.idCriador && this.atividade.idCriador !== this.usuario.id;
  }

  ngOnInit() { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params['id'];
    this.usuario = this.usuarioService.buscarAutenticacao();

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
        this.formGroup.get('idMateria')?.setValue(this.atividade.idMateria);
        this.formGroup.get('valePontuacao')?.setValue(!!this.atividade.valor);
        this.formGroup.get('valor')?.setValue(this.atividade.valor);
        this.formGroup.get('dataEntrega')?.setValue(this.atividade.dataEntrega);
        this.formGroup.get('dataEntrega')?.disable();

        // Na edição a rota não traz a sala: carrega pela atividade (matérias e períodos)
        if (!this.activatedRoute.snapshot.params['idSala'] && this.atividade.idSala) {
          this.carregarSala(this.atividade.idSala);
        }
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
        idMateria: '',
        valePontuacao: true,
        valor: '',
        dataEntrega: ''
      });
      this.formGroup.get('dataEntrega')?.enable();
    }

    const idSala = this.activatedRoute.snapshot.params['idSala'];

    if (idSala) {
      this.carregarSala(idSala);
    }
  }

  private carregarSala(idSala: string): void {
    this.salaService.buscarPorId(idSala).subscribe(res => {
      if (!res) {
        this.exibirMensagem('Sala não encontrada');
        this.navController.navigateBack('/tabs/salas');
        return;
      }
      this.sala = res;
      this.atividade.idSala = idSala;

      // Com a sala carregada dá pra conferir período e pontos disponíveis
      this.formGroup.get('dataEntrega')?.updateValueAndValidity({ emitEvent: false });
      this.revalidarValor();
    });
  }

  // ===================== v2: matéria, período e pontos =====================

  get materias(): MateriaModel[] {
    return this.sala?.materias ?? [];
  }

  /** Período em que a data escolhida cai (ou null se ainda não escolheu / está fora). */
  get periodoSelecionado(): PeriodoModel | null {
    return periodoDaData(this.sala?.periodos ?? [], this.formGroup?.get('dataEntrega')?.value || this.atividade?.dataEntrega);
  }

  get materiaSelecionada(): MateriaModel | null {
    const id = this.formGroup?.get('idMateria')?.value;
    return this.materias.find(m => m.id === id) ?? null;
  }

  /** Primeiro e último dia do ano letivo da sala, pra limitar o calendário. */
  get dataMaxima(): string {
    const periodos = this.sala.periodos ?? [];
    return periodos.length ? periodos[periodos.length - 1].dataFim : '';
  }

  get dataMinimaPermitida(): string {
    const inicio = this.sala.periodos?.[0]?.dataInicio ?? '';
    return inicio > this.hoje ? inicio : this.hoje;
  }

  get descricaoAnoLetivo(): string {
    const periodos = this.sala.periodos ?? [];
    if (!periodos.length) return '';
    return `${formatarDataBr(periodos[0].dataInicio)} a ${formatarDataBr(periodos[periodos.length - 1].dataFim)}`;
  }

  /**
   * Pontos que ainda cabem na matéria dentro do período da data escolhida.
   * Soma as atividades da sala na mesma matéria/período (menos a que está sendo editada).
   */
  get pontosDisponiveis(): number | null {
    const periodo = this.periodoSelecionado;
    const materia = this.materiaSelecionada;
    if (!periodo || !materia) return null;

    const usados = (this.sala.atividades ?? [])
      .filter(a => a.idMateria === materia.id && a.idPeriodo === periodo.id && a.id !== this.atividade?.id)
      .reduce((soma, a) => soma + (Number(a.valor) || 0), 0);

    return Math.max(0, Math.round((periodo.pontuacaoMaxima - usados) * 100) / 100);
  }

  private revalidarValor(): void {
    this.formGroup.get('valor')?.updateValueAndValidity({ emitEvent: false });
  }

  /** A data precisa cair em algum período da sala (só confere depois que a sala carregou). */
  private dentroDosPeriodos() {
    return (control: any) => {
      const periodos = this.sala?.periodos ?? [];
      if (!control.value || !periodos.length) return null;
      return periodoDaData(periodos, control.value) ? null : { foraDosPeriodos: true };
    };
  }

  /** O valor não pode passar do que sobra na matéria naquele período. */
  private cabeNoPeriodo() {
    return (control: any) => {
      const disponiveis = this.sala ? this.pontosDisponiveis : null;
      const valor = Number(control.value);
      if (disponiveis === null || !valor) return null;
      return valor > disponiveis + 0.000001 ? { acimaDoDisponivel: true } : null;
    };
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
    this.atividade.idMateria = this.formGroup.get('idMateria')?.value;
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

  exibirMensagem(texto: string): void {
    mostrarAviso(texto);
  }

  private mensagemErroAcademico(erro: any, padrao: string): string {
    return erro?.error?.message || erro?.error?.detail || erro?.message || padrao;
  }

}
