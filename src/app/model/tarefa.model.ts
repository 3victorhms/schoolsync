import { AtividadeModel } from "./atividade.model";
import { GrupoModel } from "./grupo.model";
import { UsuarioModel } from "./usuario.model";

export class SalaModel {
    id: string;
    nome: string;
    codigo: string;
    idLider: string;
    membros: UsuarioModel[];
    atividades: AtividadeModel[];
    grupos: GrupoModel[];

    constructor() {
        this.id = "";
        this.nome = "";
        this.codigo = "";
        this.idLider = "";
        this.membros = [];
        this.atividades = [];
        this.grupos = [];
    }
}