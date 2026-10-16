// feito com auxílio do Claude
//
// Menu lateral da versão web. Em tela larga (computador) ele substitui a barra
// de abas flutuante do celular; no celular ele nem aparece (ver app.component).

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonIcon, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  homeOutline,
  logOutOutline,
  notificationsOutline,
  peopleOutline,
  personOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { Subscription, filter } from 'rxjs';
import { UsuarioModel } from 'src/app/model/usuario.model';
import { LoginService } from 'src/app/services/login.service';
import { NotificacaoService } from 'src/app/services/notificacao.service';
import { NotificacaoPushService } from 'src/app/services/notificacao-push.service';

interface ItemMenu {
  titulo: string;
  icone: string;
  rota: string;
  // outras telas que pertencem a esse item (ex.: abrir uma sala deixa "Salas" marcado)
  relacionadas: string[];
  somenteAdmin?: boolean;
}

@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.component.html',
  styleUrls: ['./menu-lateral.component.scss'],
  standalone: true,
  imports: [IonIcon],
})
export class MenuLateralComponent implements OnInit, OnDestroy {

  readonly itens: ItemMenu[] = [
    { titulo: 'Início', icone: 'home-outline', rota: '/tabs/inicio', relacionadas: [] },
    {
      titulo: 'Salas', icone: 'people-outline', rota: '/tabs/salas',
      relacionadas: ['/sala', '/grupo', '/grupos', '/add-sala', '/entrar-sala', '/add-grupo', '/entrar-grupo', '/atividade', '/add-atividade', '/tarefa', '/add-tarefa']
    },
    { titulo: 'Caderno', icone: 'book-outline', rota: '/tabs/caderno', relacionadas: [] },
    { titulo: 'Notificações', icone: 'notifications-outline', rota: '/notificacao', relacionadas: [] },
    { titulo: 'Perfil', icone: 'person-outline', rota: '/tabs/perfil', relacionadas: ['/usuario'] },
    { titulo: 'Administração', icone: 'shield-checkmark-outline', rota: '/admin', relacionadas: [], somenteAdmin: true },
  ];

  usuario: UsuarioModel = this.loginService.buscarAutenticacao();
  urlAtual = '';
  naoLidas = 0;

  private inscricoes = new Subscription();

  constructor(
    private router: Router,
    private navController: NavController,
    private loginService: LoginService,
    private notificacaoService: NotificacaoService,
    private notificacaoPushService: NotificacaoPushService
  ) {
    addIcons({ homeOutline, peopleOutline, bookOutline, notificationsOutline, personOutline, shieldCheckmarkOutline, logOutOutline });
  }

  ngOnInit(): void {
    this.urlAtual = this.router.url;

    // relê o usuário a cada troca de tela, pq o nome/foto podem ter sido editados
    this.inscricoes.add(
      this.router.events.pipe(filter(evento => evento instanceof NavigationEnd)).subscribe(evento => {
        this.urlAtual = (evento as NavigationEnd).urlAfterRedirects;
        this.usuario = this.loginService.buscarAutenticacao();
      })
    );

    this.inscricoes.add(
      this.notificacaoService.notificacoes$.subscribe(notificacoes => {
        this.naoLidas = notificacoes.filter(notificacao => !notificacao.lido).length;
      })
    );
  }

  ngOnDestroy(): void {
    this.inscricoes.unsubscribe();
  }

  get itensVisiveis(): ItemMenu[] {
    return this.itens.filter(item => !item.somenteAdmin || this.usuario?.perfil === 'ADMIN');
  }

  get iniciais(): string {
    return (this.usuario?.nome || '')
      .trim()
      .split(/\s+/)
      .filter(parte => parte.length > 0)
      .slice(0, 2)
      .map(parte => parte[0].toUpperCase())
      .join('');
  }

  estaAtivo(item: ItemMenu): boolean {
    const caminho = this.urlAtual.split('?')[0];
    return [item.rota, ...item.relacionadas].some(rota => caminho === rota || caminho.startsWith(rota + '/'));
  }

  abrir(item: ItemMenu): void {
    // navigateRoot limpa o histórico, igual trocar de aba no celular
    this.navController.navigateRoot(item.rota);
  }

  abrirPerfil(): void {
    this.navController.navigateRoot('/tabs/perfil');
  }

  async sair(): Promise<void> {
    await this.notificacaoPushService.desregistrar().catch(() => undefined);
    this.loginService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }
}
