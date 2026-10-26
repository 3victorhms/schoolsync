// Feito com auxílio do Claude: testes do alerta de semana pesada.
import { AtividadeModel } from '../model/atividade.model';
import { analisarSemana, rotuloDia } from './semana.util';

// segunda-feira, 26/10/2026
const HOJE = new Date(2026, 9, 26, 10, 0, 0);

function atividade(id: string, dataEntrega: string, valor = 0, status: string | null = null): AtividadeModel {
  return Object.assign(new AtividadeModel(), { id, titulo: `Atividade ${id}`, dataEntrega, valor, status });
}

describe('analisarSemana', () => {
  it('semana tranquila com poucas entregas', () => {
    const semana = analisarSemana([atividade('a', '2026-10-27'), atividade('b', '2026-10-29')], HOJE);
    expect(semana.pesada).toBeFalse();
    expect(semana.pendentes.length).toBe(2);
  });

  it('pesada com 4 entregas pendentes em 7 dias', () => {
    const semana = analisarSemana([
      atividade('a', '2026-10-26', 5),
      atividade('b', '2026-10-28', 10),
      atividade('c', '2026-10-30', 3),
      atividade('d', '2026-11-01', 2),
    ], HOJE);
    expect(semana.pesada).toBeTrue();
    expect(semana.pontos).toBe(20);
    expect(semana.maisValiosa?.id).toBe('b');
  });

  it('pesada com 3 entregas no mesmo dia', () => {
    const semana = analisarSemana([
      atividade('a', '2026-10-29'), atividade('b', '2026-10-29'), atividade('c', '2026-10-29')
    ], HOJE);
    expect(semana.pesada).toBeTrue();
    expect(semana.diaMaisCheio?.quantidade).toBe(3);
    expect(semana.diaMaisCheio?.data.getDate()).toBe(29);
  });

  it('ignora concluídas, atrasadas e as de depois de 7 dias', () => {
    const semana = analisarSemana([
      atividade('a', '2026-10-27', 0, 'concluido'),
      atividade('b', '2026-10-20'),
      atividade('c', '2026-11-02'),
      atividade('d', '2026-11-01'),
    ], HOJE);
    expect(semana.pendentes.map(a => a.id)).toEqual(['d']);
  });
});

describe('rotuloDia', () => {
  it('escreve hoje, amanhã e o dia da semana', () => {
    expect(rotuloDia(new Date(2026, 9, 26), HOJE)).toBe('hoje');
    expect(rotuloDia(new Date(2026, 9, 27), HOJE)).toBe('amanhã');
    expect(rotuloDia(new Date(2026, 9, 29), HOJE)).toBe('na quinta (29/10)');
    expect(rotuloDia(new Date(2026, 10, 1), HOJE)).toBe('no domingo (01/11)');
  });
});
