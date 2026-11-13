export function labelPontos(valor: number | string | null | undefined): string {
  const pontos = Number(valor);

  if (!pontos) return 'Não vale ponto';

  return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
}
