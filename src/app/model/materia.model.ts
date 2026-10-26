// matéria cadastrada pelo líder ao criar ou editar a sala
export class MateriaModel {
    // vazio enquanto a matéria ainda não foi salva no servidor
    id: string;
    nome: string;

    constructor(nome: string = '', id: string = '') {
        this.id = id;
        this.nome = nome;
    }
}
