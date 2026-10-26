// Feito com auxílio do Claude: testes das regras do boletim (situação por matéria e avulsas).
import { AtividadeModel } from '../model/atividade.model';
import { NotaModel } from '../model/nota.model';
import { PeriodoModel } from '../model/periodo.model';
import { SalaModel } from '../model/sala.model';
import {
  LinhaBoletim,
  analisarMateria,
  excessoNoPeriodo,
  excessosDeAvulsas,
  montarBoletim,
  quantoFalta,
  resumirSituacoes
} from './boletim.util';

function linha(obtido: number, avaliado: number, maximo = 25, nome = 'Matéria'): LinhaBoletim {
  return { idMateria: nome, nomeMateria: nome, notas: [], obtido, avaliado, maximo };
}

function periodo(id: string, ordem: number, max = 25): PeriodoModel {
  return Object.assign(new PeriodoModel(), {
    id, ordem, nome: `${ordem}º Bimestre`, dataInicio: `2026-0${ordem}-01`, dataFim: `2026-0${ordem}-28`, pontuacaoMaxima: max
  });
}

function nota(dados: Partial<NotaModel>): NotaModel {
  return Object.assign(new NotaModel(), { idSala: 's1', avulsa: false, ...dados });
}

function atividade(dados: Partial<AtividadeModel>): AtividadeModel {
  return Object.assign(new AtividadeModel(), dados);
}

function sala(): SalaModel {
  return Object.assign(new SalaModel(), {
    id: 's1',
    materias: [{ id: 'mat', nome: 'Matemática' }, { id: 'fis', nome: 'Física' }],
    periodos: [periodo('p1', 1), periodo('p2', 2)],
    atividades: []
  });
}

describe('quantoFalta', () => {
  it('diz quanto falta e que % do que está em aberto é preciso tirar', () => {
    // máximo 25, avaliado 15, tirou 9 -> meta 15, faltam 6 dos 10 em aberto
    expect(quantoFalta(9, 15, 25)).toEqual({ situacao: 'possivel', precisa: 6, emAberto: 10, percentualDoAberto: 60 });
  });

  it('reconhece meta atingida e meta impossível', () => {
    expect(quantoFalta(15, 20, 25).situacao).toBe('atingida');
    expect(quantoFalta(2, 20, 25).situacao).toBe('impossivel');
  });

  it('sem pontos no período não tem meta', () => {
    expect(quantoFalta(0, 0, 0).situacao).toBe('sem-pontos');
  });
});

describe('analisarMateria', () => {
  it('meta atingida', () => {
    expect(analisarMateria(linha(16, 20)).situacao).toBe('atingida');
  });

  it('no caminho: precisa de uma % menor do que já vem tirando', () => {
    // 12/15 = 80%; faltam 3 dos 10 em aberto = 30%
    const analise = analisarMateria(linha(12, 15));
    expect(analise.situacao).toBe('no-caminho');
    expect(analise.aproveitamento).toBe(80);
  });

  it('atenção: precisa de uma % maior do que vem tirando', () => {
    // 5/15 = 33%; faltam 10 dos 10 em aberto = 100%
    expect(analisarMateria(linha(5, 15)).situacao).toBe('atencao');
  });

  it('fora de alcance: nem tirando tudo chega', () => {
    // 3/20; faltam 12, só 5 em aberto
    expect(analisarMateria(linha(3, 20)).situacao).toBe('fora-de-alcance');
  });

  it('sem notas quando nada foi avaliado', () => {
    expect(analisarMateria(linha(0, 0)).situacao).toBe('sem-notas');
  });

  it('revisar vence as outras quando as avulsas passam do limite', () => {
    // pela conta seria meta atingida, mas há 5 pts a mais que o período permite
    const analise = analisarMateria(linha(20, 25), undefined, 5);
    expect(analise.situacao).toBe('revisar');
    expect(analise.excesso).toBe(5);
  });
});

describe('resumirSituacoes', () => {
  it('conta por situação e põe fora de alcance antes de atenção no foco', () => {
    const resumo = resumirSituacoes([
      linha(16, 20, 25, 'Português'),
      linha(5, 15, 25, 'Física'),
      linha(3, 20, 25, 'Química'),
      linha(0, 0, 25, 'História')
    ]);
    expect(resumo.total).toBe(4);
    expect(resumo.contagem['atingida']).toBe(1);
    expect(resumo.contagem['atencao']).toBe(1);
    expect(resumo.contagem['fora-de-alcance']).toBe(1);
    expect(resumo.contagem['sem-notas']).toBe(1);
    expect(resumo.foco.map(l => l.nomeMateria)).toEqual(['Química', 'Física']);
  });

  it('põe a matéria para revisar na frente do foco', () => {
    const resumo = resumirSituacoes(
      [linha(5, 15, 25, 'Física'), linha(20, 25, 25, 'Química')],
      undefined,
      new Map([['Química', 5]])
    );
    expect(resumo.contagem['revisar']).toBe(1);
    expect(resumo.foco.map(l => l.nomeMateria)).toEqual(['Química', 'Física']);
  });
});

describe('montarBoletim', () => {
  it('soma as notas por matéria em cada período e no ano', () => {
    const s = sala();
    const notas = [
      nota({ id: 'n1', idMateria: 'mat', idPeriodo: 'p1', valorObtido: 8, valorMaximo: 10, data: '2026-01-10' }),
      nota({ id: 'n2', idMateria: 'mat', idPeriodo: 'p2', valorObtido: 4, valorMaximo: 5, data: '2026-02-10' }),
    ];
    const boletim = montarBoletim(s, notas);
    const mat1 = boletim.periodos[0].linhas.find(l => l.idMateria === 'mat')!;
    expect(mat1.obtido).toBe(8);
    expect(mat1.maximo).toBe(25);
    const matAno = boletim.ano.find(l => l.idMateria === 'mat')!;
    expect(matAno.obtido).toBe(12);
    expect(matAno.avaliado).toBe(15);
    expect(matAno.maximo).toBe(50);
  });
});

describe('avulsas acima do limite', () => {
  it('não acusa excesso sem nota avulsa', () => {
    const s = sala();
    s.atividades = [atividade({ id: 'a1', idMateria: 'mat', idPeriodo: 'p1', valor: 25 })];
    expect(excessoNoPeriodo(s, [], 'mat', s.periodos[0])).toBe(0);
  });

  it('acusa quando a turma cria atividade depois da avulsa', () => {
    const s = sala();
    // aluno lançou avulsa de 10; depois a turma cadastrou 20 pts de atividades (limite 25)
    s.atividades = [atividade({ id: 'a1', idMateria: 'mat', idPeriodo: 'p1', valor: 20 })];
    const notas = [nota({ id: 'n1', avulsa: true, idMateria: 'mat', idPeriodo: 'p1', valorObtido: 7, valorMaximo: 10 })];
    expect(excessoNoPeriodo(s, notas, 'mat', s.periodos[0])).toBe(5);
    const excessos = excessosDeAvulsas(s, notas);
    expect(excessos.length).toBe(1);
    expect(excessos[0]).toEqual(jasmine.objectContaining({ idMateria: 'mat', idPeriodo: 'p1', excesso: 5 }));
  });

  it('filtra pelo período pedido', () => {
    const s = sala();
    s.atividades = [atividade({ id: 'a1', idMateria: 'fis', idPeriodo: 'p2', valor: 20 })];
    const notas = [nota({ id: 'n1', avulsa: true, idMateria: 'fis', idPeriodo: 'p2', valorObtido: 5, valorMaximo: 8 })];
    expect(excessosDeAvulsas(s, notas, 'p1').length).toBe(0);
    expect(excessosDeAvulsas(s, notas, 'p2')[0].excesso).toBe(3);
  });
});
