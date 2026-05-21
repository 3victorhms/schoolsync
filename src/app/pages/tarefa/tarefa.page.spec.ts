import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarefaPage } from './tarefa.page';

describe('TarefaPage', () => {
  let component: TarefaPage;
  let fixture: ComponentFixture<TarefaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TarefaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
