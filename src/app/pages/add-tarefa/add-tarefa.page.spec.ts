import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddTarefaPage } from './add-tarefa.page';

describe('AddTarefaPage', () => {
  let component: AddTarefaPage;
  let fixture: ComponentFixture<AddTarefaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTarefaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
