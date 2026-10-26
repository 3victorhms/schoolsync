import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

const rotasDaAplicacao: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    title: 'Entrar',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'usuario',
    title: 'Editar perfil',
    loadComponent: () => import('./pages/usuario/usuario.page').then(m => m.UsuarioPage)
  },
  {
    path: 'add-usuario',
    title: 'Criar conta',
    loadComponent: () => import('./pages/add-usuario/add-usuario.page').then(m => m.AddUsuarioPage)
  },
  {
    path: 'manutencao',
    title: 'Em manutenção',
    loadComponent: () => import('./pages/manutencao/manutencao.page').then(m => m.ManutencaoPage)
  },
  {
    path: 'recuperar-senha',
    title: 'Recuperar senha',
    loadComponent: () => import('./pages/recuperar-senha/recuperar-senha.page').then(m => m.RecuperarSenhaPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'inicio',
        title: 'Início',
        loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage)
      },
      {
        path: 'salas',
        title: 'Salas',
        loadComponent: () => import('./pages/salas/salas.page').then(m => m.SalasPage)
      },
      {
        path: 'caderno',
        title: 'Caderno',
        loadComponent: () => import('./pages/caderno/caderno.page').then(m => m.CadernoPage)
      },
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage)
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
    ],
  },
  {
    path: 'sala',
    title: 'Sala',
    loadComponent: () => import('./pages/sala/sala.page').then(m => m.SalaPage)
  },
  {
    path: 'sala/:id',
    title: 'Sala',
    loadComponent: () => import('./pages/sala/sala.page').then(m => m.SalaPage)
  },
  {
    path: 'sala/:id/atividades',
    title: 'Atividades da sala',
    loadComponent: () => import('./pages/sala-atividades/sala-atividades.page').then(m => m.SalaAtividadesPage)
  },
  {
    path: 'sala/:id/pontos',
    title: 'Pontos por matéria',
    loadComponent: () => import('./pages/sala-pontos/sala-pontos.page').then(m => m.SalaPontosPage)
  },
  {
    path: 'sala/:id/boletim',
    title: 'Boletim',
    loadComponent: () => import('./pages/boletim/boletim.page').then(m => m.BoletimPage)
  },
  {
    path: 'sala/:idSala/nota',
    title: 'Nota',
    loadComponent: () => import('./pages/add-nota/add-nota.page').then(m => m.AddNotaPage)
  },
  {
    path: 'sala/:idSala/nota/:idNota',
    title: 'Nota',
    loadComponent: () => import('./pages/add-nota/add-nota.page').then(m => m.AddNotaPage)
  },
  {
    path: 'atividade',
    title: 'Atividade',
    loadComponent: () => import('./pages/atividade/atividade.page').then(m => m.AtividadePage)
  },
  {
    path: 'atividade/:id',
    title: 'Atividade',
    loadComponent: () => import('./pages/atividade/atividade.page').then(m => m.AtividadePage)
  },
  {
    path: 'tarefa/:id',
    title: 'Tarefa',
    loadComponent: () => import('./pages/tarefa/tarefa.page').then(m => m.TarefaPage)
  },
  {
    path: 'notificacao',
    title: 'Notificações',
    loadComponent: () => import('./pages/notificacao/notificacao.page').then(m => m.NotificacaoPage)
  },
  {
    path: 'notificacao/configuracoes',
    title: 'Configurar notificações',
    loadComponent: () => import('./pages/notificacao-configuracoes/notificacao-configuracoes.page').then(m => m.NotificacaoConfiguracoesPage)
  },
  {
    path: 'add-sala',
    title: 'Criar sala',
    loadComponent: () => import('./pages/add-sala/add-sala.page').then(m => m.AddSalaPage)
  },
  {
    path: 'add-sala-editar/:id',
    title: 'Editar sala',
    loadComponent: () => import('./pages/add-sala/add-sala.page').then(m => m.AddSalaPage)
  },
  {
    path: 'add-atividade',
    title: 'Nova atividade',
    loadComponent: () => import('./pages/add-atividade/add-atividade.page').then(m => m.AddAtividadePage)
  },
  {
    path: 'add-atividade/:idSala',
    title: 'Nova atividade',
    loadComponent: () => import('./pages/add-atividade/add-atividade.page').then(m => m.AddAtividadePage)
  },
  {
    path: 'add-atividade-editar/:id',
    title: 'Editar atividade',
    loadComponent: () => import('./pages/add-atividade/add-atividade.page').then(m => m.AddAtividadePage)
  },
  {
    path: 'entrar-sala',
    title: 'Entrar em uma sala',
    loadComponent: () => import('./pages/entrar-sala/entrar-sala.page').then(m => m.EntrarSalaPage)
  },
  {
    path: 'grupos/:idSala',
    title: 'Grupos',
    loadComponent: () => import('./pages/grupos/grupos.page').then(m => m.GruposPage)
  },
  {
    path: 'add-grupo/:idSala',
    title: 'Criar grupo',
    loadComponent: () => import('./pages/add-grupo/add-grupo.page').then(m => m.AddGrupoPage)
  },
  {
    path: 'add-grupo-editar/:id',
    title: 'Editar grupo',
    loadComponent: () => import('./pages/add-grupo/add-grupo.page').then(m => m.AddGrupoPage)
  },
  {
    path: 'entrar-grupo/:idSala',
    title: 'Entrar em um grupo',
    loadComponent: () => import('./pages/entrar-grupo/entrar-grupo.page').then(m => m.EntrarGrupoPage)
  },
  {
    path: 'grupo/:id',
    title: 'Grupo',
    loadComponent: () => import('./pages/grupo/grupo.page').then(m => m.GrupoPage)
  },
  {
    path: 'grupo/:id/tarefas',
    title: 'Tarefas do grupo',
    loadComponent: () => import('./pages/grupo-tarefas/grupo-tarefas.page').then(m => m.GrupoTarefasPage)
  },
  {
    path: 'admin',
    title: 'Administração',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
  },
];

const rotasPublicas = new Set(['', 'login', 'add-usuario', 'recuperar-senha', 'manutencao']);

export const routes: Routes = rotasDaAplicacao.map(route =>
  rotasPublicas.has(route.path || '')
    ? route
    : { ...route, canActivate: [authGuard, ...(route.canActivate || [])] }
);
