import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSalaPage } from './add-sala.page';

describe('AddSalaPage', () => {
  let component: AddSalaPage;
  let fixture: ComponentFixture<AddSalaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSalaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
