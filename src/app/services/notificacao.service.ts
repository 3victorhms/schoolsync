import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { NotificacaoModel } from '../model/notificacao.model';
import { TokenService } from './token.service';

export interface ConfiguracaoNotificacao {
  noAplicativo: boolean;
  push: boolean;
  lembreteDias: 1 | 3 | 7;
}

/** Feito com auxílio do Claude: resposta paginada da API (ver Paginacao no backend). */
export interface PaginaNotificacoes {
  itens: NotificacaoModel[];
  temMais: boolean;
  /** Todas as não lidas do usuário, não só as desta página. */
  naoLidas: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly API_URL = `${environment.apiUrl}/notificacoes`;
  private eventSource: EventSource | null = null;
  private reconexaoTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly notificacoesSubject = new BehaviorSubject<NotificacaoModel[]>([]);

  readonly notificacoes$ = this.notificacoesSubject.asObservable();

  // a lista vem em páginas, então a contagem de não lidas vem da API e não da lista carregada
  private readonly naoLidasSubject = new BehaviorSubject<number>(0);
  readonly naoLidas$ = this.naoLidasSubject.asObservable();
  private readonly TAMANHO_PAGINA = 20;
  /** Ainda há notificações mais antigas para buscar. */
  temMais = false;

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  /** Primeira página (as mais recentes). Substitui o que estava carregado. */
  listar(): Observable<PaginaNotificacoes> {
    return this.http.get<PaginaNotificacoes>(this.API_URL, { params: { tamanho: this.TAMANHO_PAGINA } }).pipe(
      tap(pagina => {
        this.notificacoesSubject.next(pagina.itens || []);
        this.temMais = pagina.temMais;
        this.naoLidasSubject.next(pagina.naoLidas || 0);
      })
    );
  }

  /** Próxima página: as anteriores à mais antiga que já está na lista. */
  carregarMais(): Observable<PaginaNotificacoes> {
    const atuais = this.notificacoesSubject.value;
    const maisAntiga = atuais[atuais.length - 1];
    if (!this.temMais || !maisAntiga) {
      return of({ itens: [], temMais: false, naoLidas: this.naoLidasSubject.value });
    }
    return this.http.get<PaginaNotificacoes>(this.API_URL, {
      params: { tamanho: this.TAMANHO_PAGINA, antesDe: maisAntiga.horario }
    }).pipe(
      tap(pagina => {
        const ids = new Set(atuais.map(notificacao => notificacao.id));
        this.notificacoesSubject.next([...atuais, ...(pagina.itens || []).filter(n => !ids.has(n.id))]);
        this.temMais = pagina.temMais;
        this.naoLidasSubject.next(pagina.naoLidas || 0);
      })
    );
  }

  marcarComoLida(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/lida`, null).pipe(
      tap(() => this.atualizarLeituraLocal(id))
    );
  }

  marcarTodasComoLidas(): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/lidas`, null).pipe(
      tap(() => {
        this.notificacoesSubject.next(
          this.notificacoesSubject.value.map(notificacao => ({ ...notificacao, lido: true }))
        );
        this.naoLidasSubject.next(0);
      })
    );
  }

  buscarConfiguracao(): Observable<ConfiguracaoNotificacao> {
    return this.http.get<ConfiguracaoNotificacao>(`${this.API_URL}/configuracoes`);
  }

  salvarConfiguracao(configuracao: ConfiguracaoNotificacao): Observable<ConfiguracaoNotificacao> {
    return this.http.put<ConfiguracaoNotificacao>(
      `${this.API_URL}/configuracoes`, configuracao
    );
  }

  conectar(): void {
    const usuarioId = this.usuarioId;
    if (!usuarioId || this.eventSource || this.reconexaoTimer) return;

    // O EventSource não envia cabeçalhos, então o token vai na URL e a API identifica o usuário por ele.
    const token = encodeURIComponent(this.tokenService.buscar() || '');
    this.eventSource = new EventSource(`${this.API_URL}/stream?token=${token}`);
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
    return this.naoLidasSubject.value;
  }

  private get usuarioId(): string {
    return this.tokenService.extrair().id
      || JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}')?.id
      || '';
  }

  private tratar(data: string): void {
    try {
      const notificacao = JSON.parse(data) as NotificacaoModel;
      const anterior = this.notificacoesSubject.value.find(item => item.id === notificacao.id);
      const atuais = this.notificacoesSubject.value.filter(item => item.id !== notificacao.id);
      this.notificacoesSubject.next([notificacao, ...atuais]);
      // mantém o contador certo: nova não lida soma; uma que já estava não lida não conta de novo
      if (!notificacao.lido && (!anterior || anterior.lido)) this.ajustarNaoLidas(1);
      if (notificacao.lido && anterior && !anterior.lido) this.ajustarNaoLidas(-1);
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

  private ajustarNaoLidas(diferenca: number): void {
    this.naoLidasSubject.next(Math.max(0, this.naoLidasSubject.value + diferenca));
  }

  private atualizarLeituraLocal(id: string): void {
    const notificacao = this.notificacoesSubject.value.find(item => item.id === id);
    if (notificacao && !notificacao.lido) this.ajustarNaoLidas(-1);
    this.notificacoesSubject.next(this.notificacoesSubject.value.map(notificacao =>
      notificacao.id === id ? { ...notificacao, lido: true } : notificacao
    ));
  }
}
