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

export function ordemUrgencia(nivel: NivelUrgencia): number {
  return ORDEM_URGENCIA[nivel];
}

const LIMITE_PROXIMA_DIAS = 3;
const LIMITE_SEMANA_DIAS = 7;
const LIMITE_MES_DIAS = 30;

// urgência da atividade pela data de entrega ("AAAA-MM-DD") e pelo status
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

export function classeUrgencia(dataEntrega: string | null | undefined, status: string | null | undefined): string {
  return `urgencia-${calcularUrgencia(dataEntrega, status)}`;
}

function parsearDataEntrega(dataEntrega: string | null | undefined): Date | null {
  if (!dataEntrega) return null;

  const dataBase = dataEntrega.includes('T') ? dataEntrega.split('T')[0] : dataEntrega;
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  if (!ano || !mes || !dia) return null;

  return new Date(ano, mes - 1, dia);
}

export const DIAS_ATE_ARQUIVAR = 3;

export function diasDeAtraso(dataEntrega: string | null | undefined): number {
  const prazo = parsearDataEntrega(dataEntrega);
  if (!prazo) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(Math.round((hoje.getTime() - prazo.getTime()) / 86400000), 0);
}

export function deveArquivar(atividade: { dataEntrega?: string | null; status?: string | null }): boolean {
  const atraso = diasDeAtraso(atividade.dataEntrega);
  if (atraso === 0) return false;
  if (atividade.status === 'concluido') return true;
  return atraso > DIAS_ATE_ARQUIVAR;
}

export function compararPorEntrega(
  a: { dataEntrega?: string | null },
  b: { dataEntrega?: string | null }
): number {
  const prazoA = parsearDataEntrega(a.dataEntrega)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const prazoB = parsearDataEntrega(b.dataEntrega)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return prazoA - prazoB;
}

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
