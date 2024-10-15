import { TestBed } from '@angular/core/testing';

import { MediaControllerService } from 'src/app/services/media-controller.service';

describe('MediaControllerService', () => {
  let service: MediaControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
