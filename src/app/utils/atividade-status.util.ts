// Rótulo, ícone e classe CSS do status de uma atividade no caderno do aluno.
// Compartilhado pelas listas de atividades (sala e página de atividades da sala).

export function classeStatus(status: string | null): string {
  if (!status || status === 'pendente') return 'nao_iniciada';
  return status;
}

export function iconeStatus(status: string | null): string {
  switch (status) {
    case 'concluido':
      return 'checkmark-circle-outline';
    case 'nao_iniciada':
    case null:
    case undefined:
      return 'ellipse-outline';
    default:
      return 'time-outline';
  }
}

export function labelStatus(status: string | null): string {
  switch (status) {
    case 'concluido':
      return 'Concluído';
    case 'nao_iniciada':
    case null:
    case undefined:
      return 'Não iniciada';
    default:
      return 'Em andamento';
  }
}
