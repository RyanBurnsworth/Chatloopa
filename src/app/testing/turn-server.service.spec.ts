import { TestBed } from '@angular/core/testing';

import { TurnServerService } from '../services/turn-server.service';

describe('TurnServerService', () => {
  let service: TurnServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TurnServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
