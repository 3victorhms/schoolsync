import { Injectable } from '@angular/core';
import { UsuarioModel } from '../model/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  salvar(usuario: UsuarioModel): UsuarioModel {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    if (usuario.id === "") {
      usuario.id = this.gerarId(11); // Gera um ID aleatório 
      usuarios.push(usuario);
    } else {
      let posicao = usuarios.findIndex((temp: UsuarioModel) => temp.id === usuario.id);
      usuarios[posicao] = usuario;
    }
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return usuario;
  }

  private gerarId(tamanho: number = 11): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
  }

  listar(): UsuarioModel[] {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    return usuarios;
  }

  buscarPorId(id: string): UsuarioModel {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let usuario = new UsuarioModel();
    usuario = usuarios.find((temp: UsuarioModel) => temp.id === id);
    return usuario;
  }

  excluir(id: string): boolean {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    usuarios = usuarios.filter((temp: UsuarioModel) => temp.id !== id);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return true;
  }

  autenticar(login: String, senha: String): UsuarioModel {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let usuario = new UsuarioModel();
    usuario = usuarios.find((temp: UsuarioModel) => temp.email === login && temp.senha === senha);
    return usuario;
  }

  verificarLogin(login: String): boolean {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    return !!usuarios.find((temp: UsuarioModel) => temp.email === login);
  }

  buscarAutenticacao(): UsuarioModel {
    let usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}');
    return usuario;
  }

  registrarAutenticacao(usuario: UsuarioModel) {
    localStorage.setItem('usuarioAutenticado', JSON.stringify(usuario));
  }

  encerrarAutenticacao() {
    localStorage.removeItem('usuarioAutenticado');
  }

}
