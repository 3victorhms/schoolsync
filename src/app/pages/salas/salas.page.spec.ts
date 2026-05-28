import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalaPage } from './sala.page';

describe('SalaPage', () => {
  let component: SalaPage;
  let fixture: ComponentFixture<SalaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SalaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
