import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacaoPage } from './notificacao.page';

describe('NotificacaoPage', () => {
  let component: NotificacaoPage;
  let fixture: ComponentFixture<NotificacaoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
