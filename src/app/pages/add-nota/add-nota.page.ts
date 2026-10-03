// v2: lançar/editar uma nota do boletim.
//  /sala/:idSala/nota?atividade=ID  → nota de uma atividade da sala (só a nota obtida)
//  /sala/:idSala/nota[?periodo=ID]  → nota avulsa (descrição, matéria, data, valor e nota)
//  /sala/:idSala/nota/:idNota       → editar uma nota existente

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonItem,
  IonIcon
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { finalize, forkJoin } from 'rxjs';
import { SalaModel } from 'src/app/model/sala.model';
import { NotaModel, NotaRequest } from 'src/app/model/nota.model';
import { AtividadeModel } from 'src/app/model/atividade.model';
import { PeriodoModel } from 'src/app/model/periodo.model';
import { SalaService } from 'src/app/services/sala.service';
import { NotaService } from 'src/app/services/nota.service';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';
import { formatarDataBr, hojeIso, periodoDaData } from 'src/app/utils/periodo.util';
import { disponivelParaAvulsa } from 'src/app/utils/boletim.util';

@Component({
  selector: 'app-add-nota',
  templateUrl: './add-nota.page.html',
  styleUrls: ['../add-atividade/add-atividade.page.scss', './add-nota.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonItem, IonIcon, CommonModule, ReactiveFormsModule]
})
export class AddNotaPage {

  idSala = '';
  sala: SalaModel = new SalaModel();
  notas: NotaModel[] = [];
  /** Nota sendo editada (null = nova). */
  nota: NotaModel | null = null;
  /** Atividade da nota (lançamento ou edição de nota de atividade). */
  atividade: AtividadeModel | null = null;

  carregando = true;
  salvando = false;
  excluindo = false;
  formGroup: FormGroup;

  readonly hoje = hojeIso();
  readonly formatarDataBr = formatarDataBr;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private salaService: SalaService,
    private notaService: NotaService,
    private confirmacaoService: ConfirmacaoService
  ) {
    addIcons({ trashOutline });

    this.formGroup = this.formBuilder.group({
      'descricao': ['', [Validators.required, Validators.maxLength(150)]],
      'idMateria': ['', Validators.required],
      'data': ['', [Validators.required, this.dataValida()]],
      'valorMaximo': ['', [Validators.required, Validators.min(0.01), this.cabeNoPeriodo()]],
      'valorObtido': ['', [Validators.required, Validators.min(0)]],
    }, { validators: this.obtidoAteOMaximo() });

    // Matéria e data mudam o espaço disponível no período
    this.formGroup.get('idMateria')?.valueChanges.subscribe(() => this.revalidarValorMaximo());
    this.formGroup.get('data')?.valueChanges.subscribe(() => this.revalidarValorMaximo());
  }

  get avulsa(): boolean {
    return !this.atividade;
  }

  get editando(): boolean {
    return !!this.nota;
  }

  ionViewWillEnter() {
    this.idSala = this.activatedRoute.snapshot.params['idSala'] || '';
    const idNota = this.activatedRoute.snapshot.params['idNota'] || '';
    const idAtividade = this.activatedRoute.snapshot.queryParams['atividade'] || '';
    const idPeriodoSugerido = this.activatedRoute.snapshot.queryParams['periodo'] || '';

    this.carregando = true;
    forkJoin({
      sala: this.salaService.buscarPorId(this.idSala),
      notas: this.notaService.listarDaSala(this.idSala),
    }).pipe(finalize(() => this.carregando = false)).subscribe({
      next: ({ sala, notas }) => {
        this.sala = sala;
        this.sala.periodos = sala.periodos || [];
        this.sala.materias = sala.materias || [];
        this.sala.atividades = sala.atividades || [];
        this.notas = notas || [];

        this.nota = idNota ? (this.notas.find(n => n.id === idNota) ?? null) : null;
        if (idNota && !this.nota) {
          mostrarAviso('Nota não encontrada.');
          this.voltar();
          return;
        }

        const idDaAtividade = this.nota?.idAtividade || idAtividade;
        this.atividade = idDaAtividade ? (this.sala.atividades.find(a => a.id === idDaAtividade) ?? null) : null;

        // Já existe nota para essa atividade: abre a edição em vez de duplicar
        if (!this.nota && this.atividade) {
          this.nota = this.notas.find(n => n.idAtividade === this.atividade!.id) ?? null;
        }

        this.prepararFormulario(idPeriodoSugerido);
      },
      error: () => {
        mostrarAviso('Não foi possível carregar a sala.');
        this.voltar();
      }
    });
  }

  private prepararFormulario(idPeriodoSugerido: string) {
    const controlesDaAvulsa = ['descricao', 'idMateria', 'data', 'valorMaximo'];

    if (this.atividade) {
      // Nota de atividade: o resto vem da atividade, só a nota obtida é digitada
      controlesDaAvulsa.forEach(c => this.formGroup.get(c)?.disable({ emitEvent: false }));
      this.formGroup.patchValue({
        descricao: this.atividade.titulo,
        idMateria: this.atividade.idMateria,
        data: this.atividade.dataEntrega,
        valorMaximo: this.atividade.valor,
        valorObtido: this.nota?.valorObtido ?? '',
      }, { emitEvent: false });
    } else {
      controlesDaAvulsa.forEach(c => this.formGroup.get(c)?.enable({ emitEvent: false }));
      const periodoSugerido = this.sala.periodos.find(p => p.id === idPeriodoSugerido);
      this.formGroup.reset({
        descricao: this.nota?.descricao ?? '',
        idMateria: this.nota?.idMateria ?? '',
        // Sugere uma data dentro do período escolhido no boletim (sem passar de hoje)
        data: this.nota?.data ?? (periodoSugerido ? this.dataSugerida(periodoSugerido) : ''),
        valorMaximo: this.nota?.valorMaximo ?? '',
        valorObtido: this.nota?.valorObtido ?? '',
      }, { emitEvent: false });
    }
    this.formGroup.updateValueAndValidity();
  }

  private dataSugerida(periodo: PeriodoModel): string {
    return periodo.dataFim < this.hoje ? periodo.dataFim : (periodo.dataInicio <= this.hoje ? this.hoje : '');
  }

  // ===================== período e pontos =====================

  get periodoSelecionado(): PeriodoModel | null {
    return periodoDaData(this.sala?.periodos ?? [], this.formGroup?.get('data')?.value);
  }

  get nomeMateriaSelecionada(): string {
    const id = this.formGroup?.get('idMateria')?.value;
    return this.sala?.materias?.find(m => m.id === id)?.nome ?? '';
  }

  /** Quanto ainda cabe na matéria/período para esta avulsa (null enquanto falta matéria ou data). */
  get disponivel(): number | null {
    const periodo = this.periodoSelecionado;
    const idMateria = this.formGroup?.get('idMateria')?.value;
    if (!this.avulsa || !periodo || !idMateria) return null;
    return disponivelParaAvulsa(this.sala, this.notas, idMateria, periodo, this.nota?.id);
  }

  get valorMaximoAtual(): number {
    return Number(this.formGroup.get('valorMaximo')?.value) || 0;
  }

  get primeiroDiaLetivo(): string {
    return this.sala.periodos[0]?.dataInicio ?? '';
  }

  get ultimoDiaPermitido(): string {
    const fim = this.sala.periodos[this.sala.periodos.length - 1]?.dataFim ?? this.hoje;
    return fim < this.hoje ? fim : this.hoje;
  }

  private revalidarValorMaximo() {
    this.formGroup.get('valorMaximo')?.updateValueAndValidity({ emitEvent: false });
  }

  private dataValida() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !this.sala?.periodos?.length) return null;
      if (control.value > this.hoje) return { futura: true };
      return periodoDaData(this.sala.periodos, control.value) ? null : { foraDosPeriodos: true };
    };
  }

  private cabeNoPeriodo() {
    return (control: AbstractControl): ValidationErrors | null => {
      const disponivel = this.sala ? this.disponivel : null;
      const valor = Number(control.value);
      if (disponivel === null || !valor) return null;
      return valor > disponivel + 0.000001 ? { acimaDoDisponivel: true } : null;
    };
  }

  private obtidoAteOMaximo() {
    return (grupo: AbstractControl): ValidationErrors | null => {
      const obtido = Number(grupo.get('valorObtido')?.value);
      const maximo = Number(grupo.get('valorMaximo')?.value);
      if (grupo.get('valorObtido')?.value === '' || !maximo) return null;
      return obtido > maximo + 0.000001 ? { obtidoAcimaDoMaximo: true } : null;
    };
  }

  campoInvalido(campo: string): boolean {
    const controle = this.formGroup.get(campo);
    return !!controle && controle.enabled && controle.invalid && (controle.touched || controle.dirty);
  }

  get obtidoAcimaDoMaximo(): boolean {
    const controle = this.formGroup.get('valorObtido');
    return this.formGroup.hasError('obtidoAcimaDoMaximo') && !!controle && (controle.touched || controle.dirty);
  }

  // ===================== salvar / excluir =====================

  salvar() {
    if (this.salvando) return;
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      mostrarAviso('Verifique os campos destacados antes de continuar.');
      return;
    }

    const valores = this.formGroup.getRawValue();
    const corpo: NotaRequest = this.avulsa
      ? {
        valorObtido: Number(valores.valorObtido),
        descricao: String(valores.descricao).trim(),
        idMateria: valores.idMateria,
        valorMaximo: Number(valores.valorMaximo),
        data: valores.data,
      }
      : { idAtividade: this.atividade!.id, valorObtido: Number(valores.valorObtido) };

    const requisicao = this.nota
      ? this.notaService.atualizar(this.nota.id, corpo)
      : this.notaService.lancar(this.idSala, corpo);

    this.salvando = true;
    requisicao.pipe(finalize(() => this.salvando = false)).subscribe({
      next: () => {
        mostrarAviso(this.nota ? 'Nota atualizada!' : 'Nota lançada no boletim!');
        this.voltar();
      },
      error: (erro) => mostrarAviso(erro?.error?.message || 'Não foi possível salvar a nota.', 4000)
    });
  }

  async excluir() {
    if (!this.nota || this.excluindo) return;
    const confirmado = await this.confirmacaoService.confirmar(
      'Excluir nota?',
      'A nota sai do seu boletim. Essa ação não pode ser desfeita.',
      'Excluir'
    );
    if (!confirmado) return;

    this.excluindo = true;
    this.notaService.excluir(this.nota.id).pipe(finalize(() => this.excluindo = false)).subscribe({
      next: () => {
        mostrarAviso('Nota excluída.');
        this.voltar();
      },
      error: (erro) => mostrarAviso(erro?.error?.message || 'Não foi possível excluir a nota.')
    });
  }

  /** Volta para quem abriu: a atividade (botão "Minha nota") ou o boletim. */
  private voltar() {
    const query = this.activatedRoute.snapshot.queryParams;
    if (query['origem'] === 'atividade' && query['atividade']) {
      this.navController.navigateBack(['/atividade', query['atividade']]);
      return;
    }
    this.navController.navigateBack(['/sala', this.idSala, 'boletim']);
  }
}
