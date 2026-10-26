// progresso das tarefas do grupo ("3 de 5 concluídas")
// compacto: barrinha na linha do grupo. completo: cartão no topo do grupo com a parte de cada membro

import { Component, Input, booleanAttribute } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

export interface ProgressoMembro {
  nome: string;
  concluidas: number;
  total: number;
  // tarefas com prazo vencido e ainda não concluídas
  atrasadas: number;
}

// "AAAA-MM-DD" (ou ISO com hora) já passou? Compara só o dia
function prazoVencido(prazo: string | null | undefined): boolean {
  if (!prazo) return false;
  const [ano, mes, dia] = prazo.split('T')[0].split('-').map(Number);
  if (!ano || !mes || !dia) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(ano, mes - 1, dia).getTime() < hoje.getTime();
}

// monta o progresso a partir da lista de tarefas do grupo
export function calcularProgresso(tarefas: { status?: string | null; nomeUsuarioAtribuido?: string | null; prazo?: string | null }[]) {
  const porNome = new Map<string, ProgressoMembro>();
  let concluidas = 0;

  for (const tarefa of tarefas || []) {
    const feita = tarefa.status === 'concluido';
    if (feita) concluidas++;

    const nome = tarefa.nomeUsuarioAtribuido || 'Sem responsável';
    const membro = porNome.get(nome) || { nome, concluidas: 0, total: 0, atrasadas: 0 };
    membro.total++;
    if (feita) membro.concluidas++;
    else if (prazoVencido(tarefa.prazo)) membro.atrasadas++;
    porNome.set(nome, membro);
  }

  // quem tem tarefa atrasada aparece primeiro, depois quem tem mais coisa pendente
  const porMembro = [...porNome.values()].sort((a, b) =>
    b.atrasadas - a.atrasadas
    || (b.total - b.concluidas) - (a.total - a.concluidas)
    || a.nome.localeCompare(b.nome, 'pt-BR'));
  const atrasadas = porMembro.reduce((soma, membro) => soma + membro.atrasadas, 0);

  return { concluidas, total: (tarefas || []).length, porMembro, atrasadas };
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
  @Input() atrasadas = 0;

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
