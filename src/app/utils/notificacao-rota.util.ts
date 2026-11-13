export function rotaDaNotificacao(tipo: string | null | undefined, targetId: string | null | undefined): string[] | null {
  if (!targetId) return null;
  const t = (tipo || '').toUpperCase();
  const principal = targetId.split(':')[0];

  if (t.includes('GRUPO') && (t.includes('TAREFA') || t.includes('CONCLUIDO'))) return ['/grupo', principal, 'tarefas'];
  if (t.includes('TAREFA')) return ['/tarefa', principal];
  if (t.includes('GRUPO') || t.includes('CONVITE')) return ['/grupo', principal];
  if (t.includes('SALA')) return ['/sala', principal];
  if (t.includes('ATIVIDADE')) return ['/atividade', principal];
  return null;
}
