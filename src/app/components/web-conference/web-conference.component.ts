import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { PeerService } from '../../services/peer.service';
import { MatDialog } from '@angular/material/dialog';
import { IntitialDialogComponent } from '../dialogs/intitial-dialog/intitial-dialog.component';
import { UserCountService } from 'src/app/services/userCount.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-web-conference',
  templateUrl: './web-conference.component.html',
  styleUrls: ['./web-conference.component.scss']
})
export class WebConferenceComponent implements OnInit, OnDestroy, AfterViewInit {
  localStream: any;
  isConnected = false;
  isServiceStarted = false;
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
    private readonly userCountService: UserCountService,
    private readonly router: Router,
    private snackBar: MatSnackBar
    ) { }

  ngOnInit(): void {
    // if the age requirement agreement is not checked, return to dialog
    if (!localStorage.getItem('Non-Minor-User') || localStorage.getItem('Non-Minor-User') !== 'true') {
      this.router.navigate(['']);
    }

    this.peerService.peerError$.subscribe((err) => {
      console.error("UI ERROR: " + err);
      this.openErrorSnackBar("Error connecting to service. Please try again");
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

  ngAfterViewInit(): void {
    this.userCountService.addToUserCount().subscribe();
  }

  ngOnDestroy(): void {
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
    window.navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        this.local.sourceObject = stream;
        this.peerService.addStream(stream);
        this.localStream = stream;
        
        this.peerService.initVideoChat();
        this.isServiceStarted = true;
      }).catch(err => {
        this.openErrorSnackBar("Error: Couldn't obtain camera and/or microphone!");
        console.error("Error obtaining camera and microphone: " + err.message);
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
        this.nextPeer();
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
    this.peerService.closeConnection();
  }

  /**
   * Stop the WebRTC service
   */
  stopService() {
    this.peerService.sendEndChatSignal();
    this.endCall();

    // turn off the camera and mic
    this.localStream.getVideoTracks()[0].stop();
    this.localStream.getAudioTracks()[0].stop();
    this.isServiceStarted = false;
  }

  /**
   * Move on to the next peer
   */
  nextPeer() {
    this.peerService.sendEndChatSignal();
    this.endCall();
    
    this.peerService.initWebRTC();
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

  openErrorSnackBar(message: string) {
    this.snackBar.open(message, "", { duration: 5000, panelClass: ['red-snackbar'] });
  }
}
