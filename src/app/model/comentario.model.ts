export class ComentarioModel {
    id: string;
    idAtividade: string;
    idAutor: string;
    nomeAutor: string;
    fotoAutor: string;
    texto: string;
    data: string;
    respondeA: string;
    tipo: string;

    constructor() {
        this.id = "";
        this.idAtividade = "";
        this.idAutor = "";
        this.nomeAutor = "";
        this.fotoAutor = "";
        this.texto = "";
        this.data = "";
        this.respondeA = "";
        this.tipo = "";
    }
}