export class GrupoModel {
    id: string;
    nome: string;
    idSala: string;
    idLider: string;
    membros: string[];
    codigoConvite: string;

    constructor() {
        this.id = "";
        this.nome = "";
        this.idSala = "";
        this.idLider = "";
        this.membros = [];
        this.codigoConvite = "";
    }
}