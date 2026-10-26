// rótulo do valor em pontos. se a atividade n vale ponto (0 ou vazio) mostra outro texto em vez de "0 pontos"
export function labelPontos(valor: number | string | null | undefined): string {
  const pontos = Number(valor);

  if (!pontos) return 'Não vale ponto';

  return `${valor} ${pontos === 1 ? 'ponto' : 'pontos'}`;
}
