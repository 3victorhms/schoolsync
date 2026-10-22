export class TarefaModel {
    id: string;
    titulo: string;
    status: string;
    dataCriacao: string;
    /** Prazo da parte de cada um ("AAAA-MM-DD"), opcional. */
    prazo?: string | null;
    idGrupo: string;
    idAtividade: string;
    tituloAtividade: string;
    materiaAtividade: string;
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
        this.materiaAtividade = "";
        this.idUsuarioAtribuido = "";
        this.nomeUsuarioAtribuido = "";
        this.idCriador = "";
        this.nomeCriador = "";
    }
}
