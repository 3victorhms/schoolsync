import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddUsuarioPage } from './add-usuario.page';

describe('AddUsuarioPage', () => {
  let component: AddUsuarioPage;
  let fixture: ComponentFixture<AddUsuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
