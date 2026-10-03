/** Matéria cadastrada pelo líder ao criar/editar a sala (v2). */
export class MateriaModel {
    /** Vazio enquanto a matéria ainda não foi salva no servidor. */
    id: string;
    nome: string;

    constructor(nome: string = '', id: string = '') {
        this.id = id;
        this.nome = nome;
    }
}
