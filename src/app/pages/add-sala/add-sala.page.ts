import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonLabel, IonButton, IonInput, IonIcon } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ToastController, NavController } from '@ionic/angular';
import { SalaModel, SalaRequest } from 'src/app/model/sala.model';
import { MateriaModel } from 'src/app/model/materia.model';
import { PeriodoModel, TipoPeriodo } from 'src/app/model/periodo.model';
import { SalaService } from 'src/app/services/sala.service';
import { finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline, lockClosedOutline } from 'ionicons/icons';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { TIPOS_PERIODO, gerarPeriodosPadrao, nomePeriodo } from 'src/app/utils/periodo.util';

/** Sugestões rápidas pra não precisar digitar as matérias mais comuns. */
const MATERIAS_SUGERIDAS = [
  'Português', 'Matemática', 'História', 'Geografia', 'Biologia',
  'Química', 'Física', 'Inglês', 'Filosofia', 'Sociologia',
];

const LIMITE_MATERIAS = 30;

@Component({
  selector: 'app-add-sala',
  templateUrl: './add-sala.page.html',
  styleUrls: ['./add-sala.page.scss'],
  standalone: true,
  imports: [IonButton, IonLabel, IonItem, IonBackButton, IonButtons, IonInput, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AddSalaPage implements OnInit {

  sala: SalaModel;
  usuario: UsuarioModel;
  formGroup: FormGroup;
  editando: boolean;
  salvando = false;

  // ===== v2: matérias =====
  materias: MateriaModel[] = [];
  novaMateria = '';
  erroMateria = '';
  tentouSalvar = false;

  // ===== v2: períodos =====
  readonly tiposPeriodo = TIPOS_PERIODO;
  tipoPeriodo: TipoPeriodo = 'BIMESTRE';
  /** Edição de uma sala que veio da API sem períodos: o formulário mostra a sugestão padrão. */
  semDivisaoSalva = false;

  constructor(
    private formBuilder: FormBuilder, private toastController: ToastController,
    private activatedRoute: ActivatedRoute, private navController: NavController,
    private salaService: SalaService, private usuarioService: UsuarioService
  ) {
    addIcons({ addOutline, closeOutline, lockClosedOutline });

    this.sala = new SalaModel();
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.editando = false;

    this.formGroup = this.formBuilder.group({
      'nomeSala': [this.sala.nome, Validators.compose([Validators.required])],
      'periodos': this.formBuilder.array([], { validators: this.periodosEmOrdem() }),
    });

    this.montarPeriodos(gerarPeriodosPadrao(this.tipoPeriodo));
  }

  ngOnInit() {
    let id = this.activatedRoute.snapshot.params['id'];

    if (id) {
      this.editando = true;

      this.salaService.buscarPorId(id).subscribe(res => {
        if (!res) {
          this.exibirMensagem('Sala não encontrada');
          return;
        }
        this.sala = res;
        this.formGroup.get('nomeSala')?.setValue(this.sala.nome);

        this.materias = (res.materias ?? []).map(m => new MateriaModel(m.nome, m.id));

        if (res.tipoPeriodo && res.periodos?.length) {
          this.tipoPeriodo = res.tipoPeriodo;
          this.montarPeriodos([...res.periodos].sort((a, b) => a.ordem - b.ordem));
          this.semDivisaoSalva = false;
        } else {
          // Sala sem divisão salva: mantém a sugestão padrão, mas avisa em vez de fingir que é a real
          this.tipoPeriodo = res.tipoPeriodo ?? this.tipoPeriodo;
          this.montarPeriodos(gerarPeriodosPadrao(this.tipoPeriodo));
          this.semDivisaoSalva = true;
        }
      });
    }
  }

  // ===================== matérias =====================

  get sugestoesDisponiveis(): string[] {
    const usadas = new Set(this.materias.map(m => this.normalizar(m.nome)));
    return MATERIAS_SUGERIDAS.filter(nome => !usadas.has(this.normalizar(nome)));
  }

  adicionarMateria(nome: string = this.novaMateria, evento?: Event): void {
    evento?.preventDefault(); // Enter no campo não pode enviar o formulário inteiro

    const nomeLimpo = (nome ?? '').trim().replace(/\s+/g, ' ');
    this.erroMateria = '';

    if (!nomeLimpo) return;

    if (nomeLimpo.length > 100) {
      this.erroMateria = 'O nome da matéria pode ter no máximo 100 caracteres.';
      return;
    }

    if (this.materias.some(m => this.normalizar(m.nome) === this.normalizar(nomeLimpo))) {
      this.erroMateria = `${nomeLimpo} já está na lista.`;
      return;
    }

    if (this.materias.length >= LIMITE_MATERIAS) {
      this.erroMateria = `Uma sala pode ter no máximo ${LIMITE_MATERIAS} matérias.`;
      return;
    }

    this.materias = [...this.materias, new MateriaModel(nomeLimpo)];
    this.novaMateria = '';
  }

  removerMateria(materia: MateriaModel): void {
    if (this.materiaEmUso(materia)) return;
    this.materias = this.materias.filter(m => m !== materia);
  }

  /** Matéria que já tem atividade não pode sair da sala (a API também bloqueia). */
  materiaEmUso(materia: MateriaModel): boolean {
    return !!materia.id && this.sala.atividades.some(a => a.idMateria === materia.id);
  }

  private normalizar(texto: string): string {
    return texto.trim().toLocaleLowerCase('pt-BR');
  }

  // ===================== períodos =====================

  get periodos(): FormArray {
    return this.formGroup.get('periodos') as FormArray;
  }

  /** Com atividades cadastradas o tipo fica travado: elas já estão ligadas aos períodos atuais. */
  get tipoTravado(): boolean {
    return this.editando && this.sala.atividades.length > 0;
  }

  get totalPontos(): number {
    const total = this.periodos.controls
      .reduce((soma, controle) => soma + (Number(controle.get('pontuacaoMaxima')?.value) || 0), 0);
    return Math.round(total * 100) / 100;
  }

  nomeDoPeriodo(indice: number): string {
    return nomePeriodo(this.tipoPeriodo, indice + 1);
  }

  selecionarTipo(tipo: TipoPeriodo): void {
    if (this.tipoTravado || tipo === this.tipoPeriodo) return;
    this.tipoPeriodo = tipo;
    this.montarPeriodos(gerarPeriodosPadrao(tipo));
    this.semDivisaoSalva = false;
  }

  /**
   * Troca a lista inteira de períodos por uma nova (setControl), em vez de clear() + push():
   * o FormArray aninhado não avisa o formulário quando muda por dentro, e a tela continuava
   * mostrando os valores antigos (a sugestão padrão) mesmo depois de carregar a sala.
   */
  private montarPeriodos(periodos: Pick<PeriodoModel, 'dataInicio' | 'dataFim' | 'pontuacaoMaxima'>[]): void {
    const grupos = periodos.map(periodo => this.formBuilder.group({
      'dataInicio': [this.somenteData(periodo.dataInicio), Validators.required],
      'dataFim': [this.somenteData(periodo.dataFim), Validators.required],
      'pontuacaoMaxima': [periodo.pontuacaoMaxima, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    }, { validators: this.fimDepoisDoInicio() }));

    this.formGroup.setControl('periodos', this.formBuilder.array(grupos, { validators: this.periodosEmOrdem() }));
  }

  /** O input type="date" só aceita "AAAA-MM-DD"; corta hora/fuso se vierem junto. */
  private somenteData(valor: string): string {
    return (valor ?? '').substring(0, 10);
  }

  private fimDepoisDoInicio() {
    return (grupo: AbstractControl): ValidationErrors | null => {
      const inicio = grupo.get('dataInicio')?.value;
      const fim = grupo.get('dataFim')?.value;
      return inicio && fim && fim < inicio ? { fimAntesDoInicio: true } : null;
    };
  }

  /** Cada período começa depois que o anterior termina. Devolve o índice do primeiro fora de ordem. */
  private periodosEmOrdem() {
    return (lista: AbstractControl): ValidationErrors | null => {
      const controles = (lista as FormArray).controls;
      for (let i = 1; i < controles.length; i++) {
        const fimAnterior = controles[i - 1].get('dataFim')?.value;
        const inicioAtual = controles[i].get('dataInicio')?.value;
        if (fimAnterior && inicioAtual && inicioAtual <= fimAnterior) {
          return { foraDeOrdem: i };
        }
      }
      return null;
    };
  }

  /** Mensagem de erro do período (ou vazio), já considerando a ordem entre eles. */
  erroPeriodo(indice: number): string {
    const grupo = this.periodos.at(indice);
    const mostrar = grupo.touched || grupo.dirty || this.tentouSalvar;
    if (!mostrar) return '';

    if (grupo.get('dataInicio')?.invalid || grupo.get('dataFim')?.invalid) {
      return 'Preencha as datas de início e fim.';
    }
    if (grupo.hasError('fimAntesDoInicio')) {
      return 'A data de fim deve ser depois da data de início.';
    }
    if (grupo.get('pontuacaoMaxima')?.invalid) {
      return 'A pontuação máxima deve ficar entre 0,01 e 100.';
    }
    if (this.periodos.getError('foraDeOrdem') === indice) {
      return `Deve começar depois do fim do ${this.nomeDoPeriodo(indice - 1)}.`;
    }
    return '';
  }

  // ===================== salvar =====================

  salvar() {
    if (this.salvando) return;
    this.tentouSalvar = true;

    if (this.novaMateria.trim()) {
      // Digitou a matéria mas não apertou "+": adiciona antes de salvar
      this.adicionarMateria();
    }

    if (this.formGroup.invalid || !this.materias.length) {
      this.formGroup.markAllAsTouched();
      this.exibirMensagem(!this.materias.length
        ? 'Cadastre pelo menos uma matéria.'
        : 'Verifique os campos destacados antes de continuar.');
      return;
    }

    this.salvando = true;

    const dados: SalaRequest = {
      nome: this.formGroup.get('nomeSala')?.value,
      materias: this.materias.map(m => m.id ? { id: m.id, nome: m.nome } : { nome: m.nome }),
      tipoPeriodo: this.tipoPeriodo,
      periodos: this.periodos.controls.map(controle => ({
        dataInicio: controle.get('dataInicio')?.value,
        dataFim: controle.get('dataFim')?.value,
        pontuacaoMaxima: Number(controle.get('pontuacaoMaxima')?.value),
      })),
    };

    this.salaService.salvar(dados, this.editando ? this.sala.id : undefined).pipe(
      finalize(() => this.salvando = false)
    ).subscribe({
      next: (salaSalva) => {
        this.exibirMensagem(this.editando ? 'Sala atualizada com sucesso!' : 'Sala criada com sucesso!');
        this.navController.navigateBack('/sala/' + salaSalva.id);
      },
      error: (erro) => {
        this.exibirMensagem(this.mensagemErro(erro, this.editando ? 'Erro ao atualizar sala.' : 'Erro ao criar sala.'));
      }
    });
  }

  /** O campo tem erro e o usuário já mexeu nele. */
  campoInvalido(campo: string): boolean {
    const controle = this.formGroup.get(campo);
    return !!controle && controle.invalid && (controle.touched || controle.dirty);
  }

  exibirMensagem(texto: string): void {
    mostrarAviso(texto, 4000);
  }

  /** A API devolve as regras de negócio (matéria em uso, atividade fora do período...) em "message". */
  private mensagemErro(erro: any, padrao: string): string {
    return erro?.error?.message || erro?.error?.detail || padrao;
  }
}
