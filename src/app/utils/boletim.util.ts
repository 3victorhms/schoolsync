// Monta o boletim a partir da sala (matérias, períodos, atividades) e das notas do aluno.
// Usado pela tela do boletim e pela exportação em PDF, para os dois mostrarem os mesmos números.

import { NotaModel } from '../model/nota.model';
import { PeriodoModel } from '../model/periodo.model';
import { SalaModel } from '../model/sala.model';
import { AtividadeModel } from '../model/atividade.model';
import { hojeIso } from './periodo.util';

export interface LinhaBoletim {
  idMateria: string;
  nomeMateria: string;
  notas: NotaModel[];
  /** Soma das notas obtidas. */
  obtido: number;
  /** Soma do valor das avaliações que já têm nota. */
  avaliado: number;
  /** Máximo possível (do período, ou a soma dos períodos no ano). */
  maximo: number;
}

export interface PeriodoBoletim {
  periodo: PeriodoModel;
  linhas: LinhaBoletim[];
  obtido: number;
  avaliado: number;
  maximo: number;
}

export interface Boletim {
  periodos: PeriodoBoletim[];
  /** Acumulado do ano por matéria. */
  ano: LinhaBoletim[];
  obtidoAno: number;
  avaliadoAno: number;
  maximoAno: number;
}

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function somar<T>(itens: T[], valor: (item: T) => number): number {
  return arredondar(itens.reduce((soma, item) => soma + (Number(valor(item)) || 0), 0));
}

export function montarBoletim(sala: SalaModel, notas: NotaModel[]): Boletim {
  const materias = sala.materias || [];

  const periodos: PeriodoBoletim[] = (sala.periodos || []).map(periodo => {
    const linhas = materias.map(materia => {
      const daLinha = notas
        .filter(n => n.idMateria === materia.id && n.idPeriodo === periodo.id)
        .sort((a, b) => a.data.localeCompare(b.data));
      return {
        idMateria: materia.id,
        nomeMateria: materia.nome,
        notas: daLinha,
        obtido: somar(daLinha, n => n.valorObtido),
        avaliado: somar(daLinha, n => n.valorMaximo),
        maximo: periodo.pontuacaoMaxima,
      };
    });
    return {
      periodo,
      linhas,
      obtido: somar(linhas, l => l.obtido),
      avaliado: somar(linhas, l => l.avaliado),
      maximo: somar(linhas, l => l.maximo),
    };
  });

  const ano: LinhaBoletim[] = materias.map(materia => {
    const doAno = periodos.map(p => p.linhas.find(l => l.idMateria === materia.id)!).filter(Boolean);
    return {
      idMateria: materia.id,
      nomeMateria: materia.nome,
      notas: doAno.reduce<NotaModel[]>((todas, l) => todas.concat(l.notas), []),
      obtido: somar(doAno, l => l.obtido),
      avaliado: somar(doAno, l => l.avaliado),
      maximo: somar(doAno, l => l.maximo),
    };
  });

  return {
    periodos,
    ano,
    obtidoAno: somar(ano, l => l.obtido),
    avaliadoAno: somar(ano, l => l.avaliado),
    maximoAno: somar(ano, l => l.maximo),
  };
}

/** Aproveitamento em % sobre o que já foi avaliado (ex.: 16 de 20 = 80%). */
export function aproveitamento(obtido: number, avaliado: number): number | null {
  return avaliado > 0 ? Math.round((obtido / avaliado) * 100) : null;
}

/** Meta usada no "quanto falta" (60% dos pontos, a média mais comum nas escolas). */
export const META_APROVACAO = 0.6;

export interface QuantoFalta {
  /** 'atingida': já tem a meta; 'possivel': dá pra chegar com o que falta avaliar; 'impossivel': não dá mais. */
  situacao: 'atingida' | 'possivel' | 'impossivel' | 'sem-pontos';
  /** Pontos que ainda faltam para a meta. */
  precisa: number;
  /** Pontos que ainda não foram avaliados (máximo - avaliado). */
  emAberto: number;
  /** Quanto dos pontos em aberto precisa tirar, em % (só quando 'possivel'). */
  percentualDoAberto: number;
}

/**
 * Feito com auxílio do Claude: "quanto falta" para chegar à meta.
 * Ex.: máximo 25, já avaliado 15, tirou 9 -> meta 15, precisa 6 dos 10 em aberto (60%).
 */
export function quantoFalta(obtido: number, avaliado: number, maximo: number, meta = META_APROVACAO): QuantoFalta {
  const arredondar = (valor: number) => Math.round(valor * 10) / 10;
  if (maximo <= 0) return { situacao: 'sem-pontos', precisa: 0, emAberto: 0, percentualDoAberto: 0 };

  const emAberto = arredondar(Math.max(maximo - avaliado, 0));
  const precisa = arredondar(Math.max(maximo * meta - obtido, 0));

  if (precisa <= 0) return { situacao: 'atingida', precisa: 0, emAberto, percentualDoAberto: 0 };
  if (precisa > emAberto) return { situacao: 'impossivel', precisa, emAberto, percentualDoAberto: 100 };
  return { situacao: 'possivel', precisa, emAberto, percentualDoAberto: Math.round((precisa / emAberto) * 100) };
}

/**
 * Atividades que valem ponto, já passaram da data de entrega e ainda não têm nota
 * lançada: são as que o aluno provavelmente já pode registrar.
 */
export function atividadesSemNota(sala: SalaModel, notas: NotaModel[], idPeriodo?: string): AtividadeModel[] {
  const comNota = new Set(notas.filter(n => n.idAtividade).map(n => n.idAtividade));
  const hoje = hojeIso();
  return (sala.atividades || [])
    .filter(a => Number(a.valor) > 0 && !comNota.has(a.id) && a.dataEntrega <= hoje)
    .filter(a => !idPeriodo || a.idPeriodo === idPeriodo)
    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));
}

/**
 * Quanto ainda cabe numa matéria/período para uma nota avulsa: máximo do período menos
 * as atividades da sala e as outras avulsas do aluno (mesma regra da API).
 */
export function disponivelParaAvulsa(
  sala: SalaModel,
  notas: NotaModel[],
  idMateria: string,
  periodo: PeriodoModel,
  idNotaIgnorada?: string
): number {
  const daSala = somar(
    (sala.atividades || []).filter(a => a.idMateria === idMateria && a.idPeriodo === periodo.id),
    a => a.valor
  );
  const avulsas = somar(
    notas.filter(n => n.avulsa && n.idMateria === idMateria && n.idPeriodo === periodo.id && n.id !== idNotaIgnorada),
    n => n.valorMaximo
  );
  return arredondar(Math.max(0, periodo.pontuacaoMaxima - daSala - avulsas));
}

// ===================== situação por matéria =====================
// Feito com auxílio do Claude. A aprovação é por matéria: 90% em física não compensa
// 40% em química. Por isso o boletim não soma matérias diferentes num total geral;
// ele mostra a situação de cada uma em relação à meta.

export type SituacaoMateria = 'atingida' | 'no-caminho' | 'atencao' | 'fora-de-alcance' | 'sem-notas' | 'sem-pontos';

/** Ordem de exibição dos contadores, da mais urgente para a mais tranquila. */
export const ORDEM_SITUACOES: SituacaoMateria[] = ['fora-de-alcance', 'atencao', 'no-caminho', 'atingida', 'sem-notas'];

export const ROTULO_SITUACAO: Record<SituacaoMateria, string> = {
  'atingida': 'Meta atingida',
  'no-caminho': 'No caminho',
  'atencao': 'Atenção',
  'fora-de-alcance': 'Fora de alcance',
  'sem-notas': 'Sem notas',
  'sem-pontos': 'Sem pontos',
};

export interface AnaliseMateria {
  situacao: SituacaoMateria;
  falta: QuantoFalta;
  /** Aproveitamento sobre o que já foi avaliado, ou null se nada foi avaliado. */
  aproveitamento: number | null;
}

/**
 * Situação de uma matéria em relação à meta:
 * - atingida: já tem os pontos da meta;
 * - fora de alcance: mesmo tirando tudo o que falta, não chega na meta;
 * - sem notas: nada avaliado ainda;
 * - atenção: ainda dá, mas precisa tirar no que falta uma % maior do que vem tirando
 *   (ex.: vem com 50% e precisa de 70% do que está em aberto);
 * - no caminho: precisa de uma % igual ou menor do que já vem tirando.
 */
export function analisarMateria(linha: LinhaBoletim, meta = META_APROVACAO): AnaliseMateria {
  const falta = quantoFalta(linha.obtido, linha.avaliado, linha.maximo, meta);
  const aprov = aproveitamento(linha.obtido, linha.avaliado);

  let situacao: SituacaoMateria;
  if (falta.situacao === 'sem-pontos') situacao = 'sem-pontos';
  else if (falta.situacao === 'atingida') situacao = 'atingida';
  else if (falta.situacao === 'impossivel') situacao = 'fora-de-alcance';
  else if (aprov === null) situacao = 'sem-notas';
  else situacao = falta.percentualDoAberto > aprov ? 'atencao' : 'no-caminho';

  return { situacao, falta, aproveitamento: aprov };
}

export interface ResumoSituacoes {
  /** Matérias que valem ponto na visão (ignora as sem pontos). */
  total: number;
  contagem: Record<SituacaoMateria, number>;
  /** Matérias que pedem foco, da mais crítica para a menos crítica. */
  foco: LinhaBoletim[];
}

export function resumirSituacoes(linhas: LinhaBoletim[], meta = META_APROVACAO): ResumoSituacoes {
  const contagem: Record<SituacaoMateria, number> = {
    'atingida': 0, 'no-caminho': 0, 'atencao': 0, 'fora-de-alcance': 0, 'sem-notas': 0, 'sem-pontos': 0,
  };
  const criticas: { linha: LinhaBoletim; peso: number }[] = [];

  linhas.forEach(linha => {
    const analise = analisarMateria(linha, meta);
    contagem[analise.situacao]++;
    // Fora de alcance vem antes de atenção; dentro de cada grupo, a que precisa de mais
    if (analise.situacao === 'fora-de-alcance') criticas.push({ linha, peso: 1000 + analise.falta.precisa });
    if (analise.situacao === 'atencao') criticas.push({ linha, peso: analise.falta.percentualDoAberto });
  });

  return {
    total: linhas.length - contagem['sem-pontos'],
    contagem,
    foco: criticas.sort((a, b) => b.peso - a.peso).map(c => c.linha),
  };
}

/** Número no formato brasileiro (7,5), sem casas quando é inteiro. */
export function formatarPontos(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : String(arredondar(valor)).replace('.', ',');
}

/** "1 pt" / "2 pts" / "7,5 pts". */
export function pts(valor: number): string {
  return `${formatarPontos(valor)} ${valor === 1 ? 'pt' : 'pts'}`;
}

/** Texto curto que acompanha a situação da matéria (mesmo texto na tela e no PDF). */
export function descreverSituacao(linha: LinhaBoletim, analise: AnaliseMateria, meta = META_APROVACAO): string {
  const { falta } = analise;
  switch (analise.situacao) {
    case 'atingida':
      return `já garantiu os ${pts(arredondar(linha.maximo * meta))} da meta`;
    case 'no-caminho':
    case 'atencao':
      return `faltam ${pts(falta.precisa)} · ${falta.percentualDoAberto}% dos ${pts(falta.emAberto)} em aberto`;
    case 'fora-de-alcance':
      return `faltam ${pts(falta.precisa)}, só ${pts(falta.emAberto)} em aberto`;
    case 'sem-notas':
      return `meta: ${pts(arredondar(linha.maximo * meta))} de ${pts(linha.maximo)}`;
    default:
      return '';
  }
}

/** "Química", "Química e Física", "Química, Física e Biologia", "Química, Física e mais 2". */
export function juntarNomes(nomes: string[], limite = 3): string {
  if (nomes.length <= 1) return nomes[0] ?? '';
  if (nomes.length > limite) {
    return `${nomes.slice(0, limite - 1).join(', ')} e mais ${nomes.length - (limite - 1)}`;
  }
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

// ===================== avulsas acima do limite =====================
// Feito com auxílio do Claude. A avulsa é pessoal e só é conferida quando o aluno a lança.
// Se a turma cria uma atividade depois, a soma (atividades da sala + avulsas do aluno) pode
// passar do máximo do período naquela matéria. Aqui calculamos esse excesso para avisar.

/** Quanto as atividades da sala + as avulsas do aluno passam do máximo do período (0 = dentro do limite). */
export function excessoNoPeriodo(sala: SalaModel, notas: NotaModel[], idMateria: string, periodo: PeriodoModel): number {
  const daSala = somar(
    (sala.atividades || []).filter(a => a.idMateria === idMateria && a.idPeriodo === periodo.id),
    a => a.valor
  );
  const avulsas = somar(
    notas.filter(n => n.avulsa && n.idMateria === idMateria && n.idPeriodo === periodo.id),
    n => n.valorMaximo
  );
  // só conta quando o aluno tem avulsa: sem avulsa, quem garante o limite é a API ao criar a atividade
  if (avulsas <= 0) return 0;
  return arredondar(Math.max(0, daSala + avulsas - periodo.pontuacaoMaxima));
}

export interface ExcessoAvulsas {
  idMateria: string;
  nomeMateria: string;
  idPeriodo: string;
  nomePeriodo: string;
  excesso: number;
}

/** Todos os pares matéria/período em que as avulsas do aluno passam do limite. */
export function excessosDeAvulsas(sala: SalaModel, notas: NotaModel[], idPeriodo?: string): ExcessoAvulsas[] {
  const resultado: ExcessoAvulsas[] = [];
  for (const periodo of sala.periodos || []) {
    if (idPeriodo && periodo.id !== idPeriodo) continue;
    for (const materia of sala.materias || []) {
      const excesso = excessoNoPeriodo(sala, notas, materia.id, periodo);
      if (excesso > 0) {
        resultado.push({ idMateria: materia.id, nomeMateria: materia.nome, idPeriodo: periodo.id, nomePeriodo: periodo.nome, excesso });
      }
    }
  }
  return resultado;
}
