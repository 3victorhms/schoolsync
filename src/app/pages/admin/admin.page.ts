import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonRefresher, IonRefresherContent, IonSearchbar, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, peopleOutline, personCircleOutline, shieldCheckmarkOutline, shieldOutline } from 'ionicons/icons';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { AdminService } from 'src/app/services/admin.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ConfirmacaoService } from 'src/app/services/confirmacao.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';

// área do perfil ADMIN: lista todas as contas do sistema.
// o botão pra chegar aqui só aparece pra admin, mas quem protege de verdade é a API:
// se um USUARIO abrir esta tela (ex: digitando /admin na versão web), a API responde 403
@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    IonBackButton, IonButtons, IonContent, IonHeader, IonIcon,
    IonRefresher, IonRefresherContent, IonSearchbar, IonTitle, IonToolbar, CommonModule
  ]
})
export class AdminPage {
  usuarios: UsuarioModel[] = [];
  busca = '';
  carregando = true;
  semPermissao = false;
  erro = '';
  idUsuarioLogado = '';
  alterandoPerfilId = '';

  constructor(
    private adminService: AdminService,
    private usuarioService: UsuarioService,
    private confirmacaoService: ConfirmacaoService
  ) {
    addIcons({ lockClosedOutline, peopleOutline, personCircleOutline, shieldCheckmarkOutline, shieldOutline });
  }

  // o botão n aparece pra própria conta nem pra conta desativada (a API também barra os dois casos)
  podeAlterarPerfil(usuario: UsuarioModel): boolean {
    return usuario.id !== this.idUsuarioLogado && usuario.ativo !== false;
  }

  async alterarPerfil(usuario: UsuarioModel): Promise<void> {
    const virarAdmin = usuario.perfil !== 'ADMIN';
    const confirmou = await this.confirmacaoService.confirmar(
      virarAdmin ? 'Tornar administrador' : 'Remover administrador',
      virarAdmin
        ? `${usuario.nome} vai poder ver todas as contas e mudar o perfil de outros usuários.`
        : `${usuario.nome} volta a ser um usuário comum e perde o acesso ao painel.`,
      virarAdmin ? 'Tornar admin' : 'Remover'
    );
    if (!confirmou) return;

    this.alterandoPerfilId = usuario.id;
    this.adminService.alterarPerfil(usuario.id, virarAdmin ? 'ADMIN' : 'USUARIO').subscribe({
      next: atualizado => {
        usuario.perfil = atualizado.perfil;
        this.alterandoPerfilId = '';
        mostrarAviso(virarAdmin ? `${usuario.nome} agora é administrador.` : `${usuario.nome} agora é usuário comum.`);
      },
      error: (erro: HttpErrorResponse) => {
        this.alterandoPerfilId = '';
        mostrarAviso(erro.error?.message || 'Não foi possível alterar o perfil.', 3500);
      }
    });
  }

  ionViewWillEnter(): void {
    this.idUsuarioLogado = this.usuarioService.buscarAutenticacao().id;
    this.carregar();
  }

  carregar(event?: any): void {
    this.carregando = true;
    this.erro = '';
    this.semPermissao = false;

    this.adminService.listarUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = [...usuarios].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
        this.carregando = false;
        event?.target.complete();
      },
      error: (erro: HttpErrorResponse) => {
        this.usuarios = [];
        this.carregando = false;
        // 403 = está logado, mas o perfil n é ADMIN (RespostasDeSeguranca.handle na API)
        if (erro.status === 403) {
          this.semPermissao = true;
        } else {
          this.erro = `Não foi possível carregar os usuários (${erro.status || 'sem conexão'}).`;
        }
        event?.target.complete();
      }
    });
  }

  get usuariosFiltrados(): UsuarioModel[] {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) return this.usuarios;
    return this.usuarios.filter(u =>
      (u.nome || '').toLowerCase().includes(termo) || (u.email || '').toLowerCase().includes(termo));
  }

  get totalAtivos(): number {
    return this.usuarios.filter(u => u.ativo !== false).length;
  }

  get totalDesativados(): number {
    return this.usuarios.filter(u => u.ativo === false).length;
  }

  get totalAdmins(): number {
    return this.usuarios.filter(u => u.perfil === 'ADMIN').length;
  }

  iniciais(nome: string): string {
    return (nome || '?')
      .split(' ')
      .filter(parte => parte.length > 0)
      .map(parte => parte[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
