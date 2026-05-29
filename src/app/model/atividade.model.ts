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
    status: Record<string, string>;
    // https://medium.com/@dhrumitpatell/understanding-the-difference-between-record-and-object-in-typescript-a-beginners-guide-1e491a9f8182
    // aprendi o tipo Record por fora das aulas de SIHS, basicamente com o conteúdo do link acima do Médium

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
        this.status = {};
    }
}