// detecta semana pesada na agenda do início: conta as entregas n concluídas de hoje até daqui a 6 dias

import { AtividadeModel } from '../model/atividade.model';
import { parsearData } from './data.util';

// a partir de quantas entregas pendentes em 7 dias a semana é pesada
export const LIMITE_ENTREGAS_SEMANA = 4;
// ...ou a partir de quantas entregas num mesmo dia
export const LIMITE_ENTREGAS_DIA = 3;

export interface AnaliseSemana {
  pesada: boolean;
  // entregas pendentes de hoje até daqui a 6 dias, por ordem de entrega
  pendentes: AtividadeModel[];
  /** Soma dos pontos dessas entregas. */
  pontos: number;
  // o dia com mais entregas (null se não há nenhuma)
  diaMaisCheio: { data: Date; quantidade: number } | null;
  // a entrega que vale mais pontos (null se nenhuma vale ponto)
  maisValiosa: AtividadeModel | null;
}

function inicioDoDia(data: Date): Date {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

export function analisarSemana(atividades: AtividadeModel[], hoje: Date = new Date()): AnaliseSemana {
  const base = inicioDoDia(hoje);
  const pendentes: AtividadeModel[] = [];
  const porDia = new Map<number, number>();

  for (const atividade of atividades || []) {
    if (atividade.status === 'concluido') continue;
    const prazo = parsearData(atividade.dataEntrega);
    if (!prazo) continue;
    const dias = Math.round((inicioDoDia(prazo).getTime() - base.getTime()) / 86400000);
    if (dias < 0 || dias > 6) continue;
    pendentes.push(atividade);
    porDia.set(dias, (porDia.get(dias) || 0) + 1);
  }

  pendentes.sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));

  let diaMaisCheio: AnaliseSemana['diaMaisCheio'] = null;
  for (const [dias, quantidade] of [...porDia.entries()].sort((a, b) => a[0] - b[0])) {
    if (!diaMaisCheio || quantidade > diaMaisCheio.quantidade) {
      const data = new Date(base);
      data.setDate(base.getDate() + dias);
      diaMaisCheio = { data, quantidade };
    }
  }

  let maisValiosa: AtividadeModel | null = null;
  for (const atividade of pendentes) {
    if (Number(atividade.valor) > 0 && (!maisValiosa || Number(atividade.valor) > Number(maisValiosa.valor))) {
      maisValiosa = atividade;
    }
  }

  const pontos = Math.round(pendentes.reduce((soma, a) => soma + (Number(a.valor) || 0), 0) * 100) / 100;
  const pesada = pendentes.length >= LIMITE_ENTREGAS_SEMANA
    || (diaMaisCheio?.quantidade ?? 0) >= LIMITE_ENTREGAS_DIA;

  return { pesada, pendentes, pontos, diaMaisCheio, maisValiosa };
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// "hoje", "amanhã" ou "na quinta (29/10)"
export function rotuloDia(data: Date, hoje: Date = new Date()): string {
  const dias = Math.round((inicioDoDia(data).getTime() - inicioDoDia(hoje).getTime()) / 86400000);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const nome = DIAS_SEMANA[data.getDay()];
  const artigo = data.getDay() === 0 || data.getDay() === 6 ? 'no' : 'na';
  return `${artigo} ${nome} (${dia}/${mes})`;
}
