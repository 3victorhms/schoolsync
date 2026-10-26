import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { servidorInterceptor } from './servidor.interceptor';

describe('servidorInterceptor', () => {
  let http: HttpClient;
  let api: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/tabs/inicio' });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([servidorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    http = TestBed.inject(HttpClient);
    api = TestBed.inject(HttpTestingController);
  });

  afterEach(() => api.verify());

  it('manda pra tela de manutenção no 503 de manutenção', () => {
    http.get(`${environment.apiUrl}/salas`).subscribe({ error: () => undefined });
    api.expectOne(`${environment.apiUrl}/salas`).flush(
      { status: 503, manutencao: true, message: 'Manutenção' },
      { status: 503, statusText: 'Service Unavailable' }
    );
    expect(router.navigate).toHaveBeenCalledWith(['/manutencao'], { replaceUrl: true });
  });

  it('não confunde um 503 qualquer com manutenção', () => {
    http.get(`${environment.apiUrl}/salas`).subscribe({ error: () => undefined });
    api.expectOne(`${environment.apiUrl}/salas`).flush('Bad Gateway', { status: 503, statusText: 'Service Unavailable' });
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
