export class TarefaModel {
    id: string;
    titulo: string;
    status: string;
    dataCriacao: string;
    idGrupo: string;
    idAtividade: string;
    tituloAtividade: string;
    disciplinaAtividade: string;
    idUsuarioAtribuido: string;
    nomeUsuarioAtribuido: string;
    idCriador: string;
    nomeCriador: string;

    constructor() {
        this.id = "";
        this.titulo = "";
        this.status = "";
        this.dataCriacao = "";
        this.idGrupo = "";
        this.idAtividade = "";
        this.tituloAtividade = "";
        this.disciplinaAtividade = "";
        this.idUsuarioAtribuido = "";
        this.nomeUsuarioAtribuido = "";
        this.idCriador = "";
        this.nomeCriador = "";
    }
}
