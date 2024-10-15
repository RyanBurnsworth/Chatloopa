import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteVideoComponent } from 'src/app/components/remote-video/remote-video.component';

describe('RemoteVideoComponent', () => {
  let component: RemoteVideoComponent;
  let fixture: ComponentFixture<RemoteVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoteVideoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
