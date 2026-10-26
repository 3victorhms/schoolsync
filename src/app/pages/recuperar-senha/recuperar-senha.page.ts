// recuperação de senha em duas etapas: o aluno informa o e-mail e recebe um código,
// depois digita o código e a senha nova. a API responde igual se o e-mail existe ou n
// (pra n revelar quem tem conta), ent a tela também n diz "e-mail não encontrado"

import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, eyeOffOutline, eyeOutline, mailOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { UsuarioService } from 'src/app/services/usuario.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';

type Etapa = 'email' | 'codigo';

const INTERVALO_REENVIO_S = 60;

function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const nova = grupo.get('novaSenha')?.value;
  const confirmacao = grupo.get('confirmacao')?.value;
  return nova && confirmacao && nova !== confirmacao ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.page.html',
  styleUrls: ['../login/login.page.scss', './recuperar-senha.page.scss'],
  standalone: true,
  imports: [IonContent, IonInput, IonButton, IonIcon, CommonModule, ReactiveFormsModule]
})
export class RecuperarSenhaPage implements OnDestroy {

  etapa: Etapa = 'email';
  email = '';
  enviando = false;
  redefinindo = false;
  mostrarSenha = false;
  segundosParaReenviar = 0;

  formEmail: FormGroup;
  formSenha: FormGroup;

  private contador: ReturnType<typeof setInterval> | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private navController: NavController,
    private route: ActivatedRoute
  ) {
    this.formEmail = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.formSenha = this.formBuilder.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\s*\d{6}\s*$/)]],
      novaSenha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', [Validators.required]]
    }, { validators: senhasIguais });

    addIcons({ arrowBackOutline, eyeOutline, eyeOffOutline, mailOutline });
  }

  ionViewWillEnter() {
    // vindo do login, já traz o e-mail que a pessoa tinha digitado
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email && !this.formEmail.value.email) {
      this.formEmail.patchValue({ email });
    }
  }

  invalido(form: FormGroup, campo: string): boolean {
    const controle = form.get(campo);
    return !!controle && controle.invalid && (controle.touched || controle.dirty);
  }

  get senhasDiferentes(): boolean {
    const confirmacao = this.formSenha.get('confirmacao');
    return !!this.formSenha.errors?.['senhasDiferentes'] && !!confirmacao && (confirmacao.touched || confirmacao.dirty);
  }

  enviarCodigo() {
    if (this.enviando) return;
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      return;
    }
    this.email = String(this.formEmail.value.email).trim();
    this.solicitar(() => {
      this.etapa = 'codigo';
      this.formSenha.reset();
    });
  }

  reenviar() {
    if (this.segundosParaReenviar > 0) return;
    this.solicitar(() => mostrarAviso('Enviamos um novo código.'));
  }

  private solicitar(aoEnviar: () => void) {
    this.enviando = true;
    this.usuarioService.solicitarRecuperacaoSenha(this.email)
      .pipe(finalize(() => this.enviando = false))
      .subscribe({
        next: () => {
          aoEnviar();
          this.iniciarContador();
        },
        error: (erro: HttpErrorResponse) => mostrarAviso(this.mensagemDeErro(erro,
          'Não foi possível enviar o código. Confira sua conexão e tente de novo.'), 4000)
      });
  }

  redefinir() {
    if (this.redefinindo) return;
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }
    const { codigo, novaSenha } = this.formSenha.value;
    this.redefinindo = true;
    this.usuarioService.redefinirSenha(this.email, String(codigo).trim(), novaSenha)
      .pipe(finalize(() => this.redefinindo = false))
      .subscribe({
        next: () => {
          // o aviso sai daqui: o Ionic reaproveita a tela de login que já estava aberta
          mostrarAviso('Senha alterada. Entre com a senha nova.', 3500);
          this.navController.navigateRoot('/login', {
            queryParams: { motivo: 'senha-redefinida', email: this.email }
          });
        },
        error: (erro: HttpErrorResponse) => mostrarAviso(this.mensagemDeErro(erro,
          'Não foi possível trocar a senha. Tente de novo.'), 4000)
      });
  }

  trocarEmail() {
    this.etapa = 'email';
    this.pararContador();
  }

  voltarLogin() {
    this.navController.navigateBack('/login');
  }

  // a API devolve { message } (TratamentoGlobalDeErros); sem resposta, é rede ou servidor fora
  private mensagemDeErro(erro: HttpErrorResponse, padrao: string): string {
    const mensagem = erro?.error?.message;
    if (erro?.status && erro.status < 500 && typeof mensagem === 'string' && mensagem) return mensagem;
    if (erro?.status === 503 && typeof mensagem === 'string' && mensagem) return mensagem;
    return padrao;
  }

  private iniciarContador() {
    this.pararContador();
    this.segundosParaReenviar = INTERVALO_REENVIO_S;
    this.contador = setInterval(() => {
      this.segundosParaReenviar--;
      if (this.segundosParaReenviar <= 0) this.pararContador();
    }, 1000);
  }

  private pararContador() {
    if (this.contador) clearInterval(this.contador);
    this.contador = null;
    this.segundosParaReenviar = 0;
  }

  ngOnDestroy() {
    this.pararContador();
  }
}
