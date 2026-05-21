export class NotificacaoModel {
    id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    horario: string;
    lido: boolean;
    targetId: string;

    constructor() {
        this.id = "";
        this.tipo = "";
        this.titulo = "";
        this.mensagem = "";
        this.horario = "";
        this.lido = false;
        this.targetId = "";
    }
}