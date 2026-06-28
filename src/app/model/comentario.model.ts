export class ComentarioModel {
    id: string;
    texto: string;
    dataCriacao: string;
    idAtividade: string;
    idUsuario: string;
    nomeUsuario: string;
    fotoUsuario: string;
    idComentarioPai: string | null;
    respostas: ComentarioModel[];

    constructor() {
        this.id = "";
        this.texto = "";
        this.dataCriacao = "";
        this.idAtividade = "";
        this.idUsuario = "";
        this.nomeUsuario = "";
        this.fotoUsuario = "";
        this.idComentarioPai = null;
        this.respostas = [];
    }
}
