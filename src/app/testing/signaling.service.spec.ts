import { TestBed } from '@angular/core/testing';

import { SignalingService } from 'src/app/services/signaling.service';

describe('SignalingService', () => {
  let service: SignalingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
