export class AtividadeModel {
    id: string;
    titulo: string;
    descricao: string;
    materia: string;
    dataEntrega: string;
    atribuidaA: string[];
    criadaPor: string;
    idSala: string;
    idGrupo: string;
    valor: string;
    status: string;

    constructor() {
        this.id = "";
        this.titulo = "";
        this.descricao = "";
        this.materia = "";
        this.dataEntrega = "";
        this.atribuidaA = [];
        this.criadaPor = "";
        this.idSala = "";
        this.idGrupo = "";
        this.valor = "";
        this.status = "";

    }
}