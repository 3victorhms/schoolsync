// formatação de datas para exibição nas listas

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function parsearData(data: string | null | undefined): Date | null {
  if (!data) return null;

  const dataBase = data.includes('T') ? data.split('T')[0] : data;
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  if (!ano || !mes || !dia) return null;

  return new Date(ano, mes - 1, dia);
}

export function formatarDataCurta(data: string | null | undefined): string {
  const convertida = parsearData(data);
  if (!convertida) return data || '';

  const texto = `${DIAS_SEMANA[convertida.getDay()]}, ${convertida.getDate()} ${MESES[convertida.getMonth()]}`;
  return convertida.getFullYear() === new Date().getFullYear()
    ? texto
    : `${texto} ${convertida.getFullYear()}`;
}
