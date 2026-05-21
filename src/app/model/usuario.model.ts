export class UsuarioModel {
    id: string;
    nome: string;
    email: string;
    senha: string;
    foto: string;
    xp: number;
    level: number;

    constructor() {
        this.id = "";
        this.nome = "";
        this.email = "";
        this.senha = "";
        this.foto = "";
        this.xp = 0;
        this.level = 0;
    }
}