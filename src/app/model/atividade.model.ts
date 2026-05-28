import { UsuarioModel } from "./usuario.model";

export class AtividadeModel {
    id: string;
    titulo: string;
    descricao: string;
    disciplina: string;
    dataEntrega: string;
    noCaderno: UsuarioModel[];
    criadaPor: string;
    idSala: string;
    valor: string;
    status: string;

    constructor() {
        this.id = "";
        this.titulo = "";
        this.descricao = "";
        this.disciplina = "";
        this.dataEntrega = "";
        this.noCaderno = [];
        this.criadaPor = "";
        this.idSala = "";
        this.valor = "";
        this.status = "";

    }
}