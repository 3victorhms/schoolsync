// Rótulo compartilhado pro valor em pontos de uma atividade. Uma atividade
// pode não valer ponto (valor 0/vazio) — nesse caso mostramos um rótulo
// dedicado em vez de "0 pontos".
export function labelPontos(valor: number | string | null | undefined): string {
  const pontos = Number(valor);

  if (!pontos) return 'Não vale ponto';

  return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
}
