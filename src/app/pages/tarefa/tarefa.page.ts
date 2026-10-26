import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { TarefaService } from 'src/app/services/tarefa.service';
import { mostrarAviso } from 'src/app/utils/aviso.util';

/**
 * Tela de passagem da notificação "Nova tarefa atribuída" (feito com auxílio do Claude).
 * A notificação só traz o id da tarefa; aqui a gente acha o grupo dela e abre a divisão de tarefas.
 */
@Component({
  selector: 'app-tarefa',
  templateUrl: './tarefa.page.html',
  styleUrls: ['./tarefa.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar, CommonModule]
})
export class TarefaPage {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private tarefaService: TarefaService
  ) { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params['id'];
    if (!id) {
      this.voltar('Tarefa não encontrada.');
      return;
    }

    this.tarefaService.listarMinhas().subscribe({
      next: (tarefas) => {
        const tarefa = (tarefas || []).find(t => t.id === id);
        if (tarefa?.idGrupo) {
          this.router.navigate(['/grupo', tarefa.idGrupo, 'tarefas'], { replaceUrl: true });
        } else {
          this.voltar('Essa tarefa foi excluída ou passada para outra pessoa.');
        }
      },
      error: () => this.voltar('Não foi possível abrir a tarefa.')
    });
  }

  private voltar(mensagem: string) {
    mostrarAviso(mensagem);
    this.router.navigate(['/notificacao'], { replaceUrl: true });
  }
}
