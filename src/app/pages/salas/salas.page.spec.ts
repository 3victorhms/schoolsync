import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalasPage } from './salas.page';

describe('SalasPage', () => {
  let component: SalasPage;
  let fixture: ComponentFixture<SalasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SalasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
