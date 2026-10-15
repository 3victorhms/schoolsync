export class UsuarioModel {
    id: string;
    nome: string;
    email: string;
    senha: string;
    foto: string;
    ativo: boolean;
    /** USUARIO ou ADMIN (vem da API no login). */
    perfil?: string;
    /** Só vai na edição do perfil, quando o e-mail ou a senha mudam. */
    senhaAtual?: string;

    constructor() {
        this.id = "";
        this.nome = "";
        this.email = "";
        this.senha = "";
        this.foto = "";
        this.ativo = true;
    }
}
