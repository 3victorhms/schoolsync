/** Nota pessoal do boletim (v2). Só o próprio aluno vê. */
export class NotaModel {
    id: string;
    idSala: string;
    idMateria: string;
    nomeMateria: string;
    idPeriodo: string;
    nomePeriodo: string;
    /** Vazio na nota avulsa. */
    idAtividade: string | null;
    /** Título da atividade ou a descrição da nota avulsa. */
    descricao: string;
    avulsa: boolean;
    valorObtido: number;
    valorMaximo: number;
    /** "AAAA-MM-DD" */
    data: string;

    constructor() {
        this.id = '';
        this.idSala = '';
        this.idMateria = '';
        this.nomeMateria = '';
        this.idPeriodo = '';
        this.nomePeriodo = '';
        this.idAtividade = null;
        this.descricao = '';
        this.avulsa = false;
        this.valorObtido = 0;
        this.valorMaximo = 0;
        this.data = '';
    }
}

/** Corpo de POST /salas/{id}/notas e PUT /notas/{id}. */
export interface NotaRequest {
    /** Preenchido para nota de atividade; ausente na avulsa. */
    idAtividade?: string;
    valorObtido: number;
    // só na avulsa:
    descricao?: string;
    idMateria?: string;
    valorMaximo?: number;
    data?: string;
}
