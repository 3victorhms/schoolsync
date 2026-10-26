import { rotaDaNotificacao } from './notificacao-rota.util';

describe('rotaDaNotificacao', () => {
  it('abre a atividade, mesmo quando o alvo é de lembrete', () => {
    expect(rotaDaNotificacao('ATIVIDADE', 'a1')).toEqual(['/atividade', 'a1']);
    expect(rotaDaNotificacao('LEMBRETE_ATIVIDADE', 'a1:2026-10-30:3')).toEqual(['/atividade', 'a1']);
  });

  it('abre a divisão de tarefas nos avisos de tarefa do grupo', () => {
    expect(rotaDaNotificacao('GRUPO_LEMBRETE_TAREFA', 'g1:abc')).toEqual(['/grupo', 'g1', 'tarefas']);
    expect(rotaDaNotificacao('GRUPO_TAREFA_CONCLUIDA', 'g1')).toEqual(['/grupo', 'g1', 'tarefas']);
    expect(rotaDaNotificacao('GRUPO_CONCLUIDO', 'g1')).toEqual(['/grupo', 'g1', 'tarefas']);
  });

  it('manda a tarefa atribuída para a tela que descobre o grupo', () => {
    expect(rotaDaNotificacao('TAREFA', 't1')).toEqual(['/tarefa', 't1']);
  });

  it('abre grupo e sala', () => {
    expect(rotaDaNotificacao('GRUPO', 'g1')).toEqual(['/grupo', 'g1']);
    expect(rotaDaNotificacao('SALA', 's1')).toEqual(['/sala', 's1']);
  });

  it('não abre nada sem alvo ou com tipo desconhecido', () => {
    expect(rotaDaNotificacao('ATIVIDADE', '')).toBeNull();
    expect(rotaDaNotificacao('OUTRO', 'x')).toBeNull();
    expect(rotaDaNotificacao(undefined, 'x')).toBeNull();
  });
});
