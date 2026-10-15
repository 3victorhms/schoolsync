import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonRefresher, IonRefresherContent, IonSearchbar, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, peopleOutline, personCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { AdminService } from 'src/app/services/admin.service';
import { UsuarioService } from 'src/app/services/usuario.service';

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

  constructor(private adminService: AdminService, private usuarioService: UsuarioService) {
    addIcons({ lockClosedOutline, peopleOutline, personCircleOutline, shieldCheckmarkOutline });
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
