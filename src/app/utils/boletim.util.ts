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
