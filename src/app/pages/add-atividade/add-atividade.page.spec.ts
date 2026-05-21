import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddAtividadePage } from './add-atividade.page';

describe('AddAtividadePage', () => {
  let component: AddAtividadePage;
  let fixture: ComponentFixture<AddAtividadePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAtividadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
