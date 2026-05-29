import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { SalaModel } from '../model/sala.model';
import { UsuarioModel } from '../model/usuario.model';
import { AtividadeModel } from '../model/atividade.model';
import { AtividadeService } from './atividade.service';

@Injectable({
  providedIn: 'root',
})
export class SalaService {

  salvar(sala: SalaModel): Observable<SalaModel> {
    let salas = JSON.parse(localStorage.getItem('salas') || '[]');
    if (!sala.id) {
      sala.id = this.gerarId(11); // Gera um ID aleatório
      sala.codigoConvite = this.gerarCodigoConvite();
      sala.membros[0] = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}') as UsuarioModel;
      // adiciona o criador como primeiro membro da sala
      salas.push(sala);
    } else {
      let posicao = salas.findIndex((temp: SalaModel) => temp.id === sala.id);
      salas[posicao] = sala;
    }
    localStorage.setItem('salas', JSON.stringify(salas));
    return of(sala);
  }

  entrar(codigoConvite: string, usuarioId: string): Observable<SalaModel> {
    const salas = JSON.parse(localStorage.getItem('salas') || '[]') as SalaModel[];

    const sala = salas.find((s: SalaModel) => s.codigoConvite === codigoConvite);

    // se sala for nulo então lança um erro
    if (!sala) {
      return throwError(() => new Error('Sala não encontrada'));
    }

    // se não for vetor declara o vetor
    if (!Array.isArray(sala.membros)) {
      sala.membros = [];
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}') as UsuarioModel;
    const idUsuarioAdicionar = usuarioId || usuario.id;

    // se o id for inválido lança um erro
    if (!idUsuarioAdicionar) {
      return throwError(() => new Error('Usuário não identificado'));
    }

    const jaMembro = sala.membros.some((m: UsuarioModel) => m && m.id === idUsuarioAdicionar);

    // só adiciona o usuário no vetor de membros dentro de sala se o id do usuário não estiver presente no vetor membros
    if (!jaMembro) {
      let usuarioAdicionar: UsuarioModel;
      if (usuario && usuario.id) {
        usuarioAdicionar = usuario;
      } else {
        usuarioAdicionar = { id: idUsuarioAdicionar } as UsuarioModel;
      }
      sala.membros.push(usuarioAdicionar);
    }

    const pos = salas.findIndex((s: SalaModel) => s.id === sala.id);
    if (pos >= 0) {
      salas[pos] = sala;
    } else {
      salas.push(sala);
    }

    localStorage.setItem('salas', JSON.stringify(salas));

    return of(sala);
  }

  adicionarAtividade(atividade: AtividadeModel, atividadeService: AtividadeService): Observable<AtividadeModel> {
    const salas = JSON.parse(localStorage.getItem('salas') || '[]') as SalaModel[];
    const pos = salas.findIndex((s: SalaModel) => s.id === atividade.idSala);

    if (pos < 0) {
      return throwError(() => new Error('Sala não encontrada'));
    }

    if (!Array.isArray(salas[pos].atividades)) {
      salas[pos].atividades = [];
    }

    if (!atividade.id) {
      atividade.id = this.gerarId(11);
    }

    if (!atividade.status || typeof atividade.status !== 'object') {
      atividade.status = {};
    }

    // salva nos dois lugares de forma síncrona
    let atividades = JSON.parse(localStorage.getItem('atividades') || '[]');
    const usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}') as UsuarioModel;
    if (!Array.isArray(atividade.noCaderno)) atividade.noCaderno = [];
    atividade.noCaderno[0] = usuario;
    atividades.push(atividade);
    localStorage.setItem('atividades', JSON.stringify(atividades));

    salas[pos].atividades.push(atividade);
    localStorage.setItem('salas', JSON.stringify(salas));

    return of(atividade);
  }

  excluirAtividade(atividade: AtividadeModel): void {
    const salas = JSON.parse(localStorage.getItem('salas') || '[]') as SalaModel[];
    const posSala = salas.findIndex((s: SalaModel) => s.id === atividade.idSala);

    if (posSala < 0) return;

    salas[posSala].atividades = salas[posSala].atividades.filter(
      (a: AtividadeModel) => a.id !== atividade.id
    );
    localStorage.setItem('salas', JSON.stringify(salas));
  }

  sincronizarAtividade(atividade: AtividadeModel): void {
    // atualiza a atividade dentro da sala, pois a arividade é salva no localstorage de atividades porém também dentro de um vetor dentro de um objeto sala
    const salas = JSON.parse(localStorage.getItem('salas') || '[]') as SalaModel[];
    const posSala = salas.findIndex((s: SalaModel) => s.id === atividade.idSala);

    if (posSala < 0) return;

    const posAtividade = salas[posSala].atividades.findIndex((a: AtividadeModel) => a.id === atividade.id);

    if (posAtividade < 0) return;

    salas[posSala].atividades[posAtividade] = atividade;
    localStorage.setItem('salas', JSON.stringify(salas));
  }

  private gerarId(tamanho: number = 11): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let resultado = '';
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
  }

  private gerarCodigoConvite(): string {
    let codigo: string;

    do {
      codigo = this.gerarId(6);
    } while (this.verificarCodigoConvite(codigo));

    return codigo;
  }

  private verificarCodigoConvite(codigo: string): boolean {
    const salas = this.listar();

    return salas.some(
      (s: SalaModel) => s.codigoConvite === codigo
    );
  }

  // criei a validação do código de convite apenas por boas práticas, pois na prática a chance de ter um código repetido é muito baixa,
  // além disso, não fiz o mesmo com o id pois as chances de repetição são desprezíveis, cerca de 1 em 50 quintilhões

  listar(): SalaModel[] {
    let salas = JSON.parse(localStorage.getItem('salas') || '[]');
    return salas;
  }

  listarPorUsuario(): SalaModel[] {
    let salas = JSON.parse(localStorage.getItem('salas') || '[]') as SalaModel[];
    const usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}') as UsuarioModel;

    if (!usuario || !usuario.id) {
      return [];
    }

    // filtra as salas que o usuário autenticado está
    return salas.filter((s: SalaModel) => {
      if (!s || !Array.isArray(s.membros)) return false; // se o objeto sala
      // se o objeto sala for inválido ou o vetor de membros não for um array a sala será pulada
      for (let i = 0; i < s.membros.length; i++) {
        const m: UsuarioModel = s.membros[i];
        if (m && m.id === usuario.id) {
          // aqui apenas verifica se o id do usuário é igual o id do membro i e se o usuário for um dos i membros da sala
          // ela será adicionada ao filtro
          return true;
        }
      }
      return false;
    });
  }

  buscarPorId(id: string): Observable<SalaModel> {
    let salas = JSON.parse(localStorage.getItem('salas') || '[]');
    let sala = salas.find((temp: SalaModel) => temp.id === id);

    return of(sala);
  }

  excluir(id: string): boolean {
    let salas = JSON.parse(localStorage.getItem('salas') || '[]');
    salas = salas.filter((temp: SalaModel) => temp.id !== id);
    localStorage.setItem('salas', JSON.stringify(salas));
    return true;
  }
}

