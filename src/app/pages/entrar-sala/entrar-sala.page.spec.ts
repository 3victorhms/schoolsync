import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntrarSalaPage } from './entrar-sala.page';

describe('EntrarSalaPage', () => {
  let component: EntrarSalaPage;
  let fixture: ComponentFixture<EntrarSalaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EntrarSalaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
