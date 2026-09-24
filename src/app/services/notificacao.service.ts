import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { NotificacaoModel } from '../model/notificacao.model';
import { TokenService } from './token.service';

export interface ConfiguracaoNotificacao {
  noAplicativo: boolean;
  push: boolean;
  lembreteDias: 1 | 3 | 7;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly API_URL = 'https://schoolsync-api-kvfx.onrender.com/notificacoes';
  private eventSource: EventSource | null = null;
  private reconexaoTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly notificacoesSubject = new BehaviorSubject<NotificacaoModel[]>([]);

  readonly notificacoes$ = this.notificacoesSubject.asObservable();

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  listar(): Observable<NotificacaoModel[]> {
    return this.http.get<NotificacaoModel[]>(`${this.API_URL}/usuario/${this.usuarioId}`).pipe(
      tap(notificacoes => this.notificacoesSubject.next(notificacoes))
    );
  }

  marcarComoLida(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/lida`, null).pipe(
      tap(() => this.atualizarLeituraLocal(id))
    );
  }

  marcarTodasComoLidas(): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/usuario/${this.usuarioId}/lidas`, null).pipe(
      tap(() => this.notificacoesSubject.next(
        this.notificacoesSubject.value.map(notificacao => ({ ...notificacao, lido: true }))
      ))
    );
  }

  buscarConfiguracao(): Observable<ConfiguracaoNotificacao> {
    return this.http.get<ConfiguracaoNotificacao>(`${this.API_URL}/usuario/${this.usuarioId}/configuracoes`);
  }

  salvarConfiguracao(configuracao: ConfiguracaoNotificacao): Observable<ConfiguracaoNotificacao> {
    return this.http.put<ConfiguracaoNotificacao>(
      `${this.API_URL}/usuario/${this.usuarioId}/configuracoes`, configuracao
    );
  }

  conectar(): void {
    const usuarioId = this.usuarioId;
    if (!usuarioId || this.eventSource || this.reconexaoTimer) return;

    // O EventSource não envia cabeçalhos, então o token vai na URL (a API confere se é do mesmo usuário).
    const token = encodeURIComponent(this.tokenService.buscar() || '');
    this.eventSource = new EventSource(`${this.API_URL}/usuario/${usuarioId}/stream?token=${token}`);
    this.eventSource.onopen = () => {
      this.listar().subscribe({ error: () => undefined });
    };
    this.eventSource.onmessage = event => this.tratar(event.data);
    ['ATIVIDADE', 'GRUPO', 'TAREFA'].forEach(tipo =>
      this.eventSource?.addEventListener(tipo, event => this.tratar((event as MessageEvent).data))
    );
    this.eventSource.onerror = () => {
      this.desconectarStream();
      this.agendarReconexao();
    };
  }

  desconectar(): void {
    if (this.reconexaoTimer) {
      clearTimeout(this.reconexaoTimer);
      this.reconexaoTimer = null;
    }
    this.desconectarStream();
  }

  get quantidadeNaoLidas(): number {
    return this.notificacoesSubject.value.filter(notificacao => !notificacao.lido).length;
  }

  private get usuarioId(): string {
    return this.tokenService.extrair().id
      || JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}')?.id
      || '';
  }

  private tratar(data: string): void {
    try {
      const notificacao = JSON.parse(data) as NotificacaoModel;
      const atuais = this.notificacoesSubject.value.filter(item => item.id !== notificacao.id);
      this.notificacoesSubject.next([notificacao, ...atuais]);
    } catch (erro) {
      console.error('Erro ao processar notificação recebida', erro);
    }
  }

  private desconectarStream(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  private agendarReconexao(): void {
    if (this.reconexaoTimer || !this.usuarioId) return;

    this.reconexaoTimer = setTimeout(() => {
      this.reconexaoTimer = null;
      this.conectar();
    }, 5000);
  }

  private atualizarLeituraLocal(id: string): void {
    this.notificacoesSubject.next(this.notificacoesSubject.value.map(notificacao =>
      notificacao.id === id ? { ...notificacao, lido: true } : notificacao
    ));
  }
}
