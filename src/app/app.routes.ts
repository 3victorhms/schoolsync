import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'usuario',
    loadComponent: () => import('./pages/usuario/usuario.page').then(m => m.UsuarioPage)
  },
  {
    path: 'add-usuario',
    loadComponent: () => import('./pages/add-usuario/add-usuario.page').then(m => m.AddUsuarioPage)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage)
  },
  {
    path: 'sala',
    loadComponent: () => import('./pages/sala/sala.page').then(m => m.SalaPage)
  },
  {
    path: 'sala/:id',
    loadComponent: () => import('./pages/sala/sala.page').then(m => m.SalaPage)
  },
  {
    path: 'atividade',
    loadComponent: () => import('./pages/atividade/atividade.page').then(m => m.AtividadePage)
  },
  {
    path: 'atividade/:id',
    loadComponent: () => import('./pages/atividade/atividade.page').then(m => m.AtividadePage)
  },
  {
    path: 'tarefa',
    loadComponent: () => import('./pages/tarefa/tarefa.page').then(m => m.TarefaPage)
  },
  {
    path: 'notificacao',
    loadComponent: () => import('./pages/notificacao/notificacao.page').then(m => m.NotificacaoPage)
  },
  {
    path: 'add-sala',
    loadComponent: () => import('./pages/add-sala/add-sala.page').then(m => m.AddSalaPage)
  },
  {
    path: 'add-sala-editar/:id',
    loadComponent: () => import('./pages/add-sala/add-sala.page').then(m => m.AddSalaPage)
  },
  {
    path: 'add-atividade',
    loadComponent: () => import('./pages/add-atividade/add-atividade.page').then(m => m.AddAtividadePage)
  },
  {
    path: 'add-atividade/:idSala',
    loadComponent: () => import('./pages/add-atividade/add-atividade.page').then(m => m.AddAtividadePage)
  },
  {
    path: 'add-atividade-editar/:id',
    loadComponent: () => import('./pages/add-atividade/add-atividade.page').then(m => m.AddAtividadePage)
  },
  {
    path: 'add-tarefa',
    loadComponent: () => import('./pages/add-tarefa/add-tarefa.page').then(m => m.AddTarefaPage)
  },
  {
    path: 'salas',
    loadComponent: () => import('./pages/salas/salas.page').then(m => m.SalasPage)
  },
  {
    path: 'entrar-sala',
    loadComponent: () => import('./pages/entrar-sala/entrar-sala.page').then(m => m.EntrarSalaPage)
  },
  {
    path: 'grupos/:idSala',
    loadComponent: () => import('./pages/grupos/grupos.page').then(m => m.GruposPage)
  },
  {
    path: 'add-grupo/:idSala',
    loadComponent: () => import('./pages/add-grupo/add-grupo.page').then(m => m.AddGrupoPage)
  },
  {
    path: 'add-grupo-editar/:id',
    loadComponent: () => import('./pages/add-grupo/add-grupo.page').then(m => m.AddGrupoPage)
  },
  {
    path: 'entrar-grupo/:idSala',
    loadComponent: () => import('./pages/entrar-grupo/entrar-grupo.page').then(m => m.EntrarGrupoPage)
  },
  {
    path: 'grupo/:id',
    loadComponent: () => import('./pages/grupo/grupo.page').then(m => m.GrupoPage)
  },
  {
    path: 'grupo/:id/tarefas',
    loadComponent: () => import('./pages/grupo-tarefas/grupo-tarefas.page').then(m => m.GrupoTarefasPage)
  },
  {
    path: 'caderno',
    loadComponent: () => import('./pages/caderno/caderno.page').then(m => m.CadernoPage)
  },
];
