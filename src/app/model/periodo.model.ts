/** Como o ano letivo da sala é dividido. Os valores batem com o enum TipoPeriodo da API. */
export type TipoPeriodo = 'BIMESTRE' | 'TRIMESTRE' | 'SEMESTRE';

/** Bimestre/trimestre/semestre da sala, com datas no formato "AAAA-MM-DD". */
export class PeriodoModel {
    id: string;
    ordem: number;
    /** Ex.: "2º Bimestre" (montado pela API). */
    nome: string;
    dataInicio: string;
    dataFim: string;
    pontuacaoMaxima: number;

    constructor() {
        this.id = '';
        this.ordem = 0;
        this.nome = '';
        this.dataInicio = '';
        this.dataFim = '';
        this.pontuacaoMaxima = 0;
    }
}
