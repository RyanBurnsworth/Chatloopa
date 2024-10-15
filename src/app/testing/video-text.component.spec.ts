import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoTextComponent } from 'src/app/components/video-text/video-text.component';

describe('VideoTextComponent', () => {
  let component: VideoTextComponent;
  let fixture: ComponentFixture<VideoTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoTextComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(VideoTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call startService and set isConnected to true', () => {
    spyOn(component, 'startService').and.callThrough();
    component.startService();
    expect(component.startService).toHaveBeenCalled();
    expect(component.isConnected).toBeTrue();
  });

  it('should call stopService and set isConnected to false', () => {
    spyOn(component, 'stopService').and.callThrough();
    component.stopService();
    expect(component.stopService).toHaveBeenCalled();
    expect(component.isConnected).toBeFalse();
  });

  it('should toggle microphone status', () => {
    component.localStream = new MediaStream();
    component.localStream.addTrack(new MediaStreamTrack());
    component.localStream.getAudioTracks()[0].enabled = true;
    component.toggleMicrophone();
    expect(component.isMicEnabled).toBeFalse();
    component.toggleMicrophone();
    expect(component.isMicEnabled).toBeTrue();
  });

  it('should toggle video status', () => {
    component.localStream = new MediaStream();
    component.localStream.addTrack(new MediaStreamTrack());
    component.localStream.getVideoTracks()[0].enabled = true;
    component.toggleLocalVideo();
    expect(component.isVideoEnabled).toBeFalse();
    component.toggleLocalVideo();
    expect(component.isVideoEnabled).toBeTrue();
  });

  it('should update connection state and call stopService on DISCONNECTED', () => {
    spyOn(component, 'stopService');
    component['currentConnectionState'] = 'CONNECTED';
    component['updateConnectionState']('DISCONNECTED');
    expect(component.stopService).toHaveBeenCalled();
  });
});