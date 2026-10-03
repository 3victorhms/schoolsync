export class AtividadeModel {

    id: string;
    titulo: string;
    descricao: string;
    /** v2: matéria cadastrada na sala (antes era o texto livre "disciplina"). */
    idMateria: string;
    nomeMateria: string;
    /** Período da sala em que a data de entrega cai, ex.: "2º Bimestre". */
    idPeriodo: string;
    nomePeriodo: string;
    dataEntrega: string;
    valor: number;

    idSala: string;
    idCriador: string;
    /** Líder da sala: pode editar e excluir qualquer atividade dela. */
    idLiderSala: string;

    estaNoCaderno: boolean;
    status: string | null;

    constructor() {
        this.id = '';
        this.titulo = '';
        this.descricao = '';
        this.idMateria = '';
        this.nomeMateria = '';
        this.idPeriodo = '';
        this.nomePeriodo = '';
        this.dataEntrega = '';
        this.valor = 0;

        this.idSala = '';
        this.idCriador = '';
        this.idLiderSala = '';

        this.estaNoCaderno = false;
        this.status = null;
    }

}