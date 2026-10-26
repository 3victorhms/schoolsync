/**
 * Para onde cada notificação leva (feito com auxílio do Claude).
 * Usado pela lista de notificações e pelo toque na notificação push, pra os dois irem pro mesmo lugar.
 *
 * Formatos do targetId que a API manda:
 * - ATIVIDADE e LEMBRETE_ATIVIDADE: "idAtividade" ou "idAtividade:data:dias"
 * - GRUPO, GRUPO_TAREFA_CONCLUIDA, GRUPO_CONCLUIDO: "idGrupo"
 * - GRUPO_LEMBRETE_TAREFA: "idGrupo:pedaço do id da tarefa"
 * - TAREFA (tarefa atribuída): "idTarefa" (a tela /tarefa/:id descobre o grupo e redireciona)
 * - SALA: "idSala"
 */
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
