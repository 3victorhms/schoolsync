import { TestBed } from '@angular/core/testing';

import { AtividadeService } from './atividade.service';

describe('AtividadeService', () => {
  let service: AtividadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtividadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
