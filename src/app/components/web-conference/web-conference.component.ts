import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, } from 'rxjs';
import { Signal } from '../../models/signal.model';
import { LoadingService } from '../../services/loading.service';
import {
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { PeerService } from '../../services/peer.service';
import * as uuid from 'uuid';

@Component({
  selector: 'app-web-conference',
  templateUrl: './web-conference.component.html',
  styleUrls: ['./web-conference.component.scss']
})
export class WebConferenceComponent implements OnInit, OnDestroy {
  localStream: any;
  isConnected = false;
  isAudioVideoReady = false;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  micSubject$ = new BehaviorSubject('mic');
  videoSubject$ = new BehaviorSubject('videocam');

  @ViewChild("local") local : any;
  @ViewChild("remote") remote: any;

  constructor(
    private readonly peerService: PeerService, 
    private readonly loadingService: LoadingService,
    ) { }

  ngOnInit(): void {
    this.peerService.peerError$.subscribe((err) => {
      console.error("UI ERROR: " + err);
    });

    this.peerService.remoteStream$.subscribe((stream) => {
      this.remote.sourceObject = stream;
    });

    this.peerService.localStream$.subscribe(() => {
      this.enableLocalStream();
    });

    this.peerService.connectionState$.subscribe((state) => {
      this.updateConnectionState(state as string);
    });
  }

  ngOnDestroy(): void {
    let sig = new Signal();
    sig.id = uuid.v4();
    sig.type = "CLOSE";
    sig.message = "";
    sig.roomId = "";
    sig.timestamp = new Date();

    this.micSubject$.unsubscribe();
    this.videoSubject$.unsubscribe();
    this.peerService.closeConnection();
  }

  /**
   * Starts the WebRTC process by first fetching a room from the service 
   * and then initializing the signaling service and then WebRTC.
   * 
   */
  public startService() {
    // reset the action button icons
    this.micSubject$.next('mic');
    this.videoSubject$.next('videocam');
    this.peerService.initWebRTC();
  }

  /**
   * Turn on local audio and video stream
   * 
   */
  private enableLocalStream() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        this.local.sourceObject = stream;
        this.peerService.addStream(stream);
        this.localStream = stream;
        
        this.peerService.initVideoChat();
        console.log("audio video enabled");
      }).catch(err => {
        console.error("PERMISSIONS NOT GRANTED!");
      });
  }

  /**
   * Executes an action based on current connection state
   * 
   * @param connectionState the latest state of the webRTC conntection
   * 
   */
  private updateConnectionState(connectionState: string) {
    switch (connectionState) {
      case "connecting":
        this.loadingService.setLoadingStatus(true);
        break;
      case "connected":
        this.loadingService.setLoadingStatus(false);
        this.isConnected = true;
        break;
      case "disconnected":
        this.endCall();
        break;
      default:
        break;
    }
  }

  /**
   * End the call and eset the UI components
   * 
   */
  endCall() {
    this.loadingService.setLoadingStatus(false);
    this.isConnected = false;
    this.micSubject$.next('mic');
    this.videoSubject$.next('videocam');

    // this.localStream.getVideoTracks()[0].stop();
    // this.localStream.getAudioTracks()[0].stop();
    this.peerService.closeConnection();
  }

  /**
   * Toggle local outgoing audio
   * 
   */
  public toggleMicrophone() {
    let micStatus = this.localStream.getAudioTracks()[0].enabled;
    this.localStream.getAudioTracks()[0].enabled = !micStatus;
    
    if (!micStatus == true) {
      this.micSubject$.next('mic');
    } else {
      this.micSubject$.next('mic_off');
    }
  }

  /**
   * Toggle local outgoing video
   * 
   */
  public toggleLocalVideo() {
    let videoStatus = this.localStream.getVideoTracks()[0].enabled;
    this.localStream.getVideoTracks()[0].enabled = !videoStatus;

    if (!videoStatus == true) {
      this.videoSubject$.next('videocam');
    } else {
      this.videoSubject$.next('videocam_off');
    }
  }
}
