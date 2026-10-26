export class AtividadeModel {

    id: string;
    titulo: string;
    descricao: string;
    // matéria cadastrada na sala
    idMateria: string;
    nomeMateria: string;
    // período da sala em que a data de entrega cai, ex.: "2º Bimestre"
    idPeriodo: string;
    nomePeriodo: string;
    dataEntrega: string;
    valor: number;

    idSala: string;
    idCriador: string;
    // líder da sala: pode editar e excluir qualquer atividade dela
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