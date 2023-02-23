import { TestBed } from '@angular/core/testing';

import { RtcService } from '../services/room.service';

describe('RoomService', () => {
  let service: RtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
