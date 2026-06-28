export class GrupoModel {
    id: string;
    nome: string;
    idSala: string;
    nomeSala: string;
    idCriador: string;
    nomeCriador: string;
    membros: MembroGrupoModel[];
    codigoConvite: string;
    criador: boolean;
    quantidadeMembros: number;
    quantidadeTarefas: number;
    tarefas: TarefaGrupoModel[];

    constructor() {
        this.id = "";
        this.nome = "";
        this.idSala = "";
        this.nomeSala = "";
        this.idCriador = "";
        this.nomeCriador = "";
        this.membros = [];
        this.codigoConvite = "";
        this.criador = false;
        this.quantidadeMembros = 0;
        this.quantidadeTarefas = 0;
        this.tarefas = [];
    }
}

export class MembroGrupoModel {
    idUsuario: string;
    nomeUsuario: string;
    fotoUsuario: string;
    criador: boolean;

    constructor() {
        this.idUsuario = "";
        this.nomeUsuario = "";
        this.fotoUsuario = "";
        this.criador = false;
    }
}

export class TarefaGrupoModel {
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
