// Escala de urgência compartilhada (psicologia das cores): quanto mais perto
// do prazo, mais "quente" a cor (vermelho = urgente/atrasado, passando por
// laranja e amarelo, até verde/azul = tranquilo ou concluído).
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
