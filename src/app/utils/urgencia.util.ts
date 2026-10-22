// Escala de urgência compartilhada (psicologia das cores): quanto mais perto
// do prazo, mais "quente" a cor (vermelho = urgente/atrasado, passando por
// laranja e amarelo, até azul = tranquilo, está longe). Verde fica só para concluída.
//
// Usada tanto no calendário (src/app/pages/inicio) quanto nas listas de
// atividades (caderno, sala), pra manter o mesmo padrão visual em todo o app.
export type NivelUrgencia = 'atrasada' | 'hoje' | 'proxima' | 'semana' | 'mes' | 'futuro' | 'concluida';

const ORDEM_URGENCIA: Record<NivelUrgencia, number> = {
  atrasada: 0,
  hoje: 1,
  proxima: 2,
  semana: 3,
  mes: 4,
  futuro: 5,
  concluida: 6
};

/** Quanto menor, mais urgente. Útil pra escolher o pior caso entre várias atividades. */
export function ordemUrgencia(nivel: NivelUrgencia): number {
  return ORDEM_URGENCIA[nivel];
}

// Janelas fixas em dias a partir de hoje (em vez de "resto da semana civil"
// ou "resto do mês"): assim a largura de cada faixa de cor não muda
// dependendo de qual dia da semana/mês é hoje — no domingo (fim da semana
// civil) ou perto do fim do mês, a faixa não "encolhe" ou desaparece.
const LIMITE_PROXIMA_DIAS = 3;
const LIMITE_SEMANA_DIAS = 7;
const LIMITE_MES_DIAS = 30;

/**
 * Classifica a urgência de uma atividade a partir da data de entrega
 * (formato "AAAA-MM-DD") e do status atual.
 */
export function calcularUrgencia(dataEntrega: string | null | undefined, status: string | null | undefined): NivelUrgencia {
  if (status === 'concluido') return 'concluida';
  if (!dataEntrega) return 'futuro';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataBase = dataEntrega.includes('T') ? dataEntrega.split('T')[0] : dataEntrega;
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  if (!ano || !mes || !dia) return 'futuro';

  const prazo = new Date(ano, mes - 1, dia);
  const diferenca = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);

  if (diferenca < 0) return 'atrasada';
  if (diferenca === 0) return 'hoje';
  if (diferenca <= LIMITE_PROXIMA_DIAS) return 'proxima';
  if (diferenca <= LIMITE_SEMANA_DIAS) return 'semana';
  if (diferenca <= LIMITE_MES_DIAS) return 'mes';
  return 'futuro';
}

/** Classe CSS correspondente, pra usar direto em [ngClass]. */
export function classeUrgencia(dataEntrega: string | null | undefined, status: string | null | undefined): string {
  return `urgencia-${calcularUrgencia(dataEntrega, status)}`;
}

/** Converte "AAAA-MM-DD" (ou ISO com hora) na meia-noite local desse dia. */
function parsearDataEntrega(dataEntrega: string | null | undefined): Date | null {
  if (!dataEntrega) return null;

  const dataBase = dataEntrega.includes('T') ? dataEntrega.split('T')[0] : dataEntrega;
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  if (!ano || !mes || !dia) return null;

  return new Date(ano, mes - 1, dia);
}

/** Por quantos dias uma atividade atrasada (e não concluída) continua à vista antes de ser arquivada. */
export const DIAS_ATE_ARQUIVAR = 3;

/** Quantos dias o prazo já passou (0 se a entrega é hoje, no futuro ou não tem data). */
export function diasDeAtraso(dataEntrega: string | null | undefined): number {
  const prazo = parsearDataEntrega(dataEntrega);
  if (!prazo) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(Math.round((hoje.getTime() - prazo.getTime()) / 86400000), 0);
}

/**
 * Regra única de arquivamento, usada na sala, nas atividades da sala, no
 * caderno e no Início. Nada é salvo no banco: é calculado pela data toda vez,
 * então nunca fica desatualizado.
 *  - o prazo ainda não passou: nunca arquiva;
 *  - o prazo passou e o aluno concluiu: arquiva na hora (não tem mais nada a fazer);
 *  - o prazo passou e não concluiu: fica à vista como "Atrasada" por
 *    DIAS_ATE_ARQUIVAR dias e depois vai para as arquivadas.
 * O status é o do aluno logado (vem do caderno dele), por isso uma mesma
 * atividade pode estar arquivada para um colega e atrasada para outro.
 */
export function deveArquivar(atividade: { dataEntrega?: string | null; status?: string | null }): boolean {
  const atraso = diasDeAtraso(atividade.dataEntrega);
  if (atraso === 0) return false;
  if (atividade.status === 'concluido') return true;
  return atraso > DIAS_ATE_ARQUIVAR;
}

/** Ordena pela data de entrega, da mais próxima para a mais distante (sem data vai pro fim). */
export function compararPorEntrega(
  a: { dataEntrega?: string | null },
  b: { dataEntrega?: string | null }
): number {
  const prazoA = parsearDataEntrega(a.dataEntrega)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const prazoB = parsearDataEntrega(b.dataEntrega)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return prazoA - prazoB;
}

/**
 * Texto curto que acompanha a cor de urgência, para a informação não depender
 * só da cor: "Atrasada", "Hoje", "Amanhã", "Em 3 dias". Vazio para concluídas
 * e para prazos a mais de uma semana.
 */
export function rotuloUrgencia(dataEntrega: string | null | undefined, status: string | null | undefined): string {
  if (status === 'concluido') return '';

  const prazo = parsearDataEntrega(dataEntrega);
  if (!prazo) return '';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diferenca = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);

  if (diferenca < 0) return 'Atrasada';
  if (diferenca === 0) return 'Hoje';
  if (diferenca === 1) return 'Amanhã';
  if (diferenca <= LIMITE_SEMANA_DIAS) return `Em ${diferenca} dias`;
  return '';
}
