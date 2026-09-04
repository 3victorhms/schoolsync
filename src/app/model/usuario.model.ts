export class UsuarioModel {
    id: string;
    nome: string;
    email: string;
    senha: string;
    foto: string;
    ativo: boolean;

    constructor() {
        this.id = "";
        this.nome = "";
        this.email = "";
        this.senha = "";
        this.foto = "";
        this.ativo = true;
    }
}
