// feito com auxílio do Claude
//
// Progresso das tarefas de um grupo ("3 de 5 concluídas"). Aparece de dois jeitos:
//  - compacto: barrinha dentro da linha do grupo (sala e lista de grupos);
//  - completo: cartão no topo do grupo e da divisão de tarefas, com a parte de cada membro.

import { Component, Input, booleanAttribute } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

export interface ProgressoMembro {
  nome: string;
  concluidas: number;
  total: number;
}

/** Monta o progresso a partir da lista de tarefas do grupo. */
export function calcularProgresso(tarefas: { status?: string | null; nomeUsuarioAtribuido?: string | null }[]) {
  const porNome = new Map<string, ProgressoMembro>();
  let concluidas = 0;

  for (const tarefa of tarefas || []) {
    const feita = tarefa.status === 'concluido';
    if (feita) concluidas++;

    const nome = tarefa.nomeUsuarioAtribuido || 'Sem responsável';
    const membro = porNome.get(nome) || { nome, concluidas: 0, total: 0 };
    membro.total++;
    if (feita) membro.concluidas++;
    porNome.set(nome, membro);
  }

  // quem tem mais coisa pendente aparece primeiro
  const porMembro = [...porNome.values()].sort((a, b) =>
    (b.total - b.concluidas) - (a.total - a.concluidas) || a.nome.localeCompare(b.nome, 'pt-BR'));

  return { concluidas, total: (tarefas || []).length, porMembro };
}

@Component({
  selector: 'app-progresso-tarefas',
  templateUrl: './progresso-tarefas.component.html',
  styleUrls: ['./progresso-tarefas.component.scss'],
  standalone: true,
  imports: [IonIcon],
})
export class ProgressoTarefasComponent {
  @Input() concluidas = 0;
  @Input() total = 0;
  // dá pra escrever só <app-progresso-tarefas compacto>, sem [compacto]="true"
  @Input({ transform: booleanAttribute }) compacto = false;
  @Input() porMembro: ProgressoMembro[] = [];

  constructor() {
    addIcons({ checkmarkCircle });
  }

  get percentual(): number {
    return this.total ? Math.round((this.concluidas / this.total) * 100) : 0;
  }

  get completo(): boolean {
    return this.total > 0 && this.concluidas === this.total;
  }

  percentualDe(membro: ProgressoMembro): number {
    return membro.total ? Math.round((membro.concluidas / membro.total) * 100) : 0;
  }
}
