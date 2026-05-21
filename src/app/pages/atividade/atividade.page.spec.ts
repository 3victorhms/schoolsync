import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AtividadePage } from './atividade.page';

describe('AtividadePage', () => {
  let component: AtividadePage;
  let fixture: ComponentFixture<AtividadePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AtividadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
