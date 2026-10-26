// pra onde cada notificação leva (a lista e o push usam a mesma regra)
// targetId que a API manda:
// ATIVIDADE e LEMBRETE_ATIVIDADE: "idAtividade" ou "idAtividade:data:dias"
// GRUPO, GRUPO_TAREFA_CONCLUIDA, GRUPO_CONCLUIDO: "idGrupo"
// GRUPO_LEMBRETE_TAREFA: "idGrupo:pedaço do id da tarefa"
// TAREFA: "idTarefa" (a tela /tarefa/:id acha o grupo e redireciona)
// SALA: "idSala"
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
