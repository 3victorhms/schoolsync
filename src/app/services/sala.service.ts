import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SalaModel } from '../model/sala.model';
import { UsuarioModel } from '../model/usuario.model';

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

