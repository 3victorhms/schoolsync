export class AtividadeModel {

    id: string;
    titulo: string;
    descricao: string;
    disciplina: string;
    dataEntrega: string;
    valor: number;

    idSala: string;
    idCriador: string;

    estaNoCaderno: boolean;
    status: string | null;

    constructor() {
        this.id = '';
        this.titulo = '';
        this.descricao = '';
        this.disciplina = '';
        this.dataEntrega = '';
        this.valor = 0;

        this.idSala = '';
        this.idCriador = '';

        this.estaNoCaderno = false;
        this.status = null;
    }

}