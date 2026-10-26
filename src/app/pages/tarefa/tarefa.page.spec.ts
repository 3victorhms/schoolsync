import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TarefaService } from 'src/app/services/tarefa.service';
import { TarefaPage } from './tarefa.page';

describe('TarefaPage', () => {
  let component: TarefaPage;
  let fixture: ComponentFixture<TarefaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TarefaPage],
      providers: [
        provideRouter([]),
        { provide: TarefaService, useValue: { listarMinhas: () => of([]) } }
      ]
    });
    fixture = TestBed.createComponent(TarefaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
