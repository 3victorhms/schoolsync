// escala de urgência: quanto mais perto do prazo, mais quente a cor (vermelho, laranja, amarelo,
// até azul quando tá longe). verde só pra concluída. usada no calendário e nas listas de atividades
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

// quanto menor, mais urgente. útil pra escolher o pior caso entre várias atividades
export function ordemUrgencia(nivel: NivelUrgencia): number {
  return ORDEM_URGENCIA[nivel];
}

// janelas fixas em dias a partir de hoje (e n "resto da semana/mês"), pra faixa de cor
// n mudar de tamanho dependendo do dia
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

// classe CSS correspondente, pra usar direto em [ngClass]
export function classeUrgencia(dataEntrega: string | null | undefined, status: string | null | undefined): string {
  return `urgencia-${calcularUrgencia(dataEntrega, status)}`;
}

// converte "AAAA-MM-DD" (ou ISO com hora) na meia-noite local desse dia
function parsearDataEntrega(dataEntrega: string | null | undefined): Date | null {
  if (!dataEntrega) return null;

  const dataBase = dataEntrega.includes('T') ? dataEntrega.split('T')[0] : dataEntrega;
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  if (!ano || !mes || !dia) return null;

  return new Date(ano, mes - 1, dia);
}

// por quantos dias uma atividade atrasada (e não concluída) continua à vista antes de ser arquivada
export const DIAS_ATE_ARQUIVAR = 3;

// quantos dias o prazo já passou (0 se a entrega é hoje, no futuro ou não tem data)
export function diasDeAtraso(dataEntrega: string | null | undefined): number {
  const prazo = parsearDataEntrega(dataEntrega);
  if (!prazo) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(Math.round((hoje.getTime() - prazo.getTime()) / 86400000), 0);
}

// regra de arquivamento (sala, atividades da sala, caderno e início). nada é salvo no banco,
// é calculado pela data toda vez:
// prazo n passou: n arquiva
// prazo passou e concluiu: arquiva na hora
// prazo passou e n concluiu: fica como "Atrasada" por DIAS_ATE_ARQUIVAR dias e depois arquiva
// o status é o do aluno logado, ent a mesma atividade pode estar arquivada pra um e atrasada pra outro
export function deveArquivar(atividade: { dataEntrega?: string | null; status?: string | null }): boolean {
  const atraso = diasDeAtraso(atividade.dataEntrega);
  if (atraso === 0) return false;
  if (atividade.status === 'concluido') return true;
  return atraso > DIAS_ATE_ARQUIVAR;
}

// ordena pela data de entrega, da mais próxima para a mais distante (sem data vai pro fim)
export function compararPorEntrega(
  a: { dataEntrega?: string | null },
  b: { dataEntrega?: string | null }
): number {
  const prazoA = parsearDataEntrega(a.dataEntrega)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const prazoB = parsearDataEntrega(b.dataEntrega)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return prazoA - prazoB;
}

// texto que acompanha a cor, pra informação n depender só da cor: "Atrasada", "Hoje",
// "Amanhã", "Em 3 dias". vazio pra concluída e pra prazo com mais de uma semana
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
