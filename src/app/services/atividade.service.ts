import { Injectable } from '@angular/core';
import { AtividadeModel } from '../model/atividade.model';
import { Observable, of } from 'rxjs';
import { UsuarioModel } from '../model/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class AtividadeService {

  salvar(atividade: AtividadeModel): Observable<AtividadeModel> {
    let atividades = JSON.parse(localStorage.getItem('atividades') || '[]');

    if (!atividade.id) {
      atividade.id = this.gerarId(11); // Gera um ID aleatório
      atividade.noCaderno[0] = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}') as UsuarioModel;
      // adiciona a atividade no caderno do usuário criador
      atividades.push(atividade);
    } else {
      let posicao = atividades.findIndex((temp: AtividadeModel) => temp.id === atividade.id);
      atividades[posicao] = atividade;
    }
    localStorage.setItem('atividades', JSON.stringify(atividades));
    return of(atividade);
  }

  buscarPorId(id: string): Observable<AtividadeModel> {
    let atividades = JSON.parse(localStorage.getItem('atividades') || '[]');
    let atividade = atividades.find((temp: AtividadeModel) => temp.id === id);

    return of(atividade);
  }

  listar(): AtividadeModel[] {
    return JSON.parse(localStorage.getItem('atividades') || '[]');
  }

  listarPorSala(idSala: string): AtividadeModel[] {
    return this.listar().filter((a: AtividadeModel) => a.idSala === idSala);
  }

  excluir(id: string): boolean {
    let atividades = this.listar().filter((a: AtividadeModel) => a.id !== id);
    localStorage.setItem('atividades', JSON.stringify(atividades));
    return true;
  }

  private gerarId(tamanho: number = 11): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let resultado = '';
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
  }
}
