// Regras de períodos letivos (v2) usadas na criação de sala e de atividade.
// As datas trafegam como "AAAA-MM-DD"; nesse formato a comparação de strings
// já respeita a ordem cronológica.

import { PeriodoModel, TipoPeriodo } from '../model/periodo.model';

export const TIPOS_PERIODO: { valor: TipoPeriodo; rotulo: string; quantidade: number }[] = [
  { valor: 'BIMESTRE', rotulo: 'Bimestre', quantidade: 4 },
  { valor: 'TRIMESTRE', rotulo: 'Trimestre', quantidade: 3 },
  { valor: 'SEMESTRE', rotulo: 'Semestre', quantidade: 2 },
];

/** Divisão de pontos mais comum em cada tipo (soma 100). */
const PONTOS_PADRAO: Record<TipoPeriodo, number[]> = {
  BIMESTRE: [25, 25, 25, 25],
  TRIMESTRE: [30, 30, 40],
  SEMESTRE: [50, 50],
};

export function quantidadeDePeriodos(tipo: TipoPeriodo): number {
  return TIPOS_PERIODO.find(t => t.valor === tipo)?.quantidade ?? 0;
}

/** Ex.: nomePeriodo('BIMESTRE', 2) = "2º Bimestre". */
export function nomePeriodo(tipo: TipoPeriodo, ordem: number): string {
  const rotulo = TIPOS_PERIODO.find(t => t.valor === tipo)?.rotulo ?? '';
  return `${ordem}º ${rotulo}`;
}

/** Período da sala em que a data cai (início e fim inclusos), ou null. */
export function periodoDaData(periodos: PeriodoModel[], data: string | null | undefined): PeriodoModel | null {
  if (!data) return null;
  const dia = data.split('T')[0];
  return periodos.find(p => p.dataInicio <= dia && dia <= p.dataFim) ?? null;
}

/** "2027-03-10" → "10/03/2027". */
export function formatarDataBr(data: string | null | undefined): string {
  if (!data) return '';
  const [ano, mes, dia] = data.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

function paraIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Sugestão inicial de períodos: ano letivo de 1º de fevereiro a 15 de dezembro
 * dividido em partes iguais. Em novembro/dezembro já sugere o ano seguinte.
 * O líder ajusta as datas e os pontos na tela antes de salvar.
 */
export function gerarPeriodosPadrao(tipo: TipoPeriodo, hoje: Date = new Date()): { dataInicio: string; dataFim: string; pontuacaoMaxima: number }[] {
  const ano = hoje.getMonth() >= 10 ? hoje.getFullYear() + 1 : hoje.getFullYear();
  const inicioAno = new Date(ano, 1, 1);
  const fimAno = new Date(ano, 11, 15);
  const umDia = 24 * 60 * 60 * 1000;
  const totalDias = Math.round((fimAno.getTime() - inicioAno.getTime()) / umDia) + 1;
  const quantidade = quantidadeDePeriodos(tipo);
  const pontos = PONTOS_PADRAO[tipo];

  return Array.from({ length: quantidade }, (_, i) => {
    const inicio = new Date(ano, 1, 1 + Math.floor((i * totalDias) / quantidade));
    const fim = new Date(ano, 1, Math.floor(((i + 1) * totalDias) / quantidade));
    return {
      dataInicio: paraIso(inicio),
      dataFim: paraIso(fim),
      pontuacaoMaxima: pontos[i],
    };
  });
}

/** Hoje em "AAAA-MM-DD" no fuso do aparelho (toISOString usaria UTC e erraria à noite). */
export function hojeIso(hoje: Date = new Date()): string {
  return paraIso(hoje);
}

/**
 * Período "da vez": o que contém hoje; antes do ano letivo, o primeiro;
 * no recesso entre dois períodos, o próximo; depois do fim, o último.
 */
export function periodoAtual(periodos: PeriodoModel[], hoje: Date = new Date()): PeriodoModel | null {
  if (!periodos?.length) return null;
  const dia = paraIso(hoje);
  return periodoDaData(periodos, dia)
    ?? periodos.find(p => p.dataInicio > dia)
    ?? periodos[periodos.length - 1];
}

/** Dias corridos de hoje até a data (negativo se já passou). */
export function diasAte(data: string, hoje: Date = new Date()): number {
  const [ano, mes, dia] = data.split('T')[0].split('-').map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo.getTime() - base.getTime()) / 86400000);
}

/** Texto curto sobre o período: "termina em 12 dias", "começa em 3 dias", "encerrado". */
export function situacaoPeriodo(periodo: PeriodoModel, hoje: Date = new Date()): string {
  const ateInicio = diasAte(periodo.dataInicio, hoje);
  if (ateInicio > 0) return ateInicio === 1 ? 'começa amanhã' : `começa em ${ateInicio} dias`;

  const ateFim = diasAte(periodo.dataFim, hoje);
  if (ateFim < 0) return 'encerrado';
  if (ateFim === 0) return 'termina hoje';
  return ateFim === 1 ? 'termina amanhã' : `termina em ${ateFim} dias`;
}

/** Pontos distribuídos em uma matéria dentro de um período, a partir das atividades da sala. */
export interface PontosDaMateria {
  idMateria: string;
  nomeMateria: string;
  distribuidos: number;
  maximo: number;
  restantes: number;
  quantidadeAtividades: number;
}

export function pontosPorMateria(
  materias: { id: string; nome: string }[],
  atividades: { idMateria: string; idPeriodo: string; valor: number }[],
  periodo: PeriodoModel
): PontosDaMateria[] {
  return materias.map(materia => {
    const daMateria = atividades.filter(a => a.idMateria === materia.id && a.idPeriodo === periodo.id);
    const distribuidos = arredondar(daMateria.reduce((soma, a) => soma + (Number(a.valor) || 0), 0));
    return {
      idMateria: materia.id,
      nomeMateria: materia.nome,
      distribuidos,
      maximo: periodo.pontuacaoMaxima,
      restantes: arredondar(Math.max(0, periodo.pontuacaoMaxima - distribuidos)),
      quantidadeAtividades: daMateria.length,
    };
  });
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
