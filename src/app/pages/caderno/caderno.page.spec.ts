import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadernoPage } from './caderno.page';

describe('CadernoPage', () => {
  let component: CadernoPage;
  let fixture: ComponentFixture<CadernoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CadernoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
