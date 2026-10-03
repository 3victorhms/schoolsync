import { AtividadeModel } from "./atividade.model";
import { GrupoModel } from "./grupo.model";
import { MateriaModel } from "./materia.model";
import { PeriodoModel, TipoPeriodo } from "./periodo.model";
import { UsuarioModel } from "./usuario.model";

export class SalaModel {
    id: string;
    nome: string;
    codigoConvite: string;
    idLider: string;
    tipoPeriodo: TipoPeriodo | null;
    materias: MateriaModel[];
    periodos: PeriodoModel[];
    membros: UsuarioModel[];
    atividades: AtividadeModel[];
    grupos: GrupoModel[];
    quantidadeMembros?: number;
    quantidadeAtividades?: number;

    constructor() {
        this.id = "";
        this.nome = "";
        this.codigoConvite = "";
        this.idLider = "";
        this.tipoPeriodo = null;
        this.materias = [];
        this.periodos = [];
        this.membros = [];
        this.atividades = [];
        this.grupos = [];
        this.quantidadeMembros = 0;
        this.quantidadeAtividades = 0;
    }
}

/** O que a API espera para criar ou editar uma sala (SalaRequestDTO). */
export interface SalaRequest {
    nome: string;
    /** Na edição, matérias com id são mantidas/renomeadas e as que saírem da lista são removidas. */
    materias: { id?: string; nome: string }[];
    tipoPeriodo: TipoPeriodo;
    /** Em ordem: o primeiro é o 1º bimestre/trimestre/semestre. */
    periodos: { dataInicio: string; dataFim: string; pontuacaoMaxima: number }[];
}
