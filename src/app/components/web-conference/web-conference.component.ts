import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PeerService } from '../../services/peer.service';
import { MatDialog } from '@angular/material/dialog';
import { TosAgreementDialog } from '../dialogs/tos-agreement-dialog/tos-agreement-dialog.component';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { MediaControllerService } from 'src/app/services/media-controller.service';
import { RtcService } from 'src/app/services/rtc.service';
import { StatusService } from 'src/app/services/status.service';
import { BUTTON_CLICK_EVENT, CLOSED, CONNECTED, CONNECTION_STATUS_EVENT, DISCONNECTED, FAILED, PERMISSION_ERROR, SEARCHING, START_CHAT, STOP_CHAT, TOGGLE_MIC_OFF, TOGGLE_MIC_ON, TOGGLE_VIDEO_OFF, TOGGLE_VIDEO_ON } from 'src/app/shared/constants';

@Component({
  selector: 'app-web-conference',
  templateUrl: './web-conference.component.html',
  styleUrls: ['./web-conference.component.scss']
})
export class WebConferenceComponent implements OnInit, OnDestroy, AfterViewInit {
  private localStream: MediaStream;

  loadingStatus: string = '';

  isConnected = false;
  showControls = false;

  isMicEnabled = true;
  isVideoEnabled = true;

  private currentConnectionState = DISCONNECTED;

  @ViewChild("local") local: any;
  @ViewChild("remote") remote: any;

  constructor(
    private readonly rtcService: RtcService,
    private readonly peerService: PeerService,
    private readonly analyticsService: AnalyticsService,
    private readonly mediaControllerService: MediaControllerService,
    private readonly statusService: StatusService,
    private readonly dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // listen for incoming local stream update
    this.mediaControllerService.getLocalStream().subscribe((stream) => {
      this.enableLocalStream(stream);

      this.peerService.registerRoom();
    });

    // listen for incoming remote stream
    this.mediaControllerService.getRemoteStream().subscribe((stream) => {
      this.remote.sourceObject = stream;
    });

    // listen for the status of the chat
    this.statusService.status$.subscribe((status) => {
      this.updateConnectionState(status);
    });
  }

  ngAfterViewInit(): void {
    // open the Terms of Service Agreement dialog
    this.openTosDialog();
  }

  ngOnDestroy(): void {
    this.rtcService.closeConnection();
  }

  /**
   * End the call by sending a signal to the peer and then stopping the service
   * Used when the End Call button is clicked
   * 
   */
  public endCall() {
    this.peerService.sendEndChatSignal();
    this.statusService.setStatus(DISCONNECTED);
    this.stopService();
  }

  /**
   * Starts the WebRTC process by first fetching a room from the service 
   * and then initializing the signaling service and then WebRTC.
   * 
   */
  public startService() {
    this.isConnected = true;

    // reset the action button icons
    this.isMicEnabled = true;
    this.isVideoEnabled = true;

    // initialize the WebRTC service
    this.rtcService.initializeWebRTC();

    // re-enable the localStream if available, otherwise fetch it
    if (this.localStream) {
      this.localStream.getVideoTracks()[0].enabled = true;
      this.localStream.getAudioTracks()[0].enabled = true;

      this.mediaControllerService.setLocalStream(this.localStream);

      // set the status to searching to kick off the signaling process
      this.statusService.setStatus(SEARCHING);
    } else {
      this.mediaControllerService.getLocalMediaStream();
    }

    // send event to Google Analytics
    this.analyticsService.trackEvent(START_CHAT, 'User clicked next peer button', BUTTON_CLICK_EVENT);
  }

  /**
   * Stop the WebRTC service
   */
  stopService() {
    // turn off the camera and mic
    if (this.localStream) {
      this.localStream.getVideoTracks()[0].enabled = false;
      this.localStream.getAudioTracks()[0].enabled = false;

      this.isMicEnabled = false;
      this.isVideoEnabled = false;
    }

    this.isConnected = false;

    this.rtcService.closeConnection();

    if (this.local) {
      this.local.sourceObject = null;
    }

    if (this.remote) {
      this.remote.sourceObject = null;
    }

    this.analyticsService.trackEvent(STOP_CHAT, 'User stopped the current chat', BUTTON_CLICK_EVENT);
  }

  /**
   * Open the Terms of Service agreement dialog
   *
   */
  private openTosDialog() {
    const dialogRef = this.dialog.open(TosAgreementDialog, {
      panelClass: 'dialog-style',
      disableClose: true,
      autoFocus: true
    });

    // Perform action after the dialog is closed
    dialogRef.afterClosed().subscribe(result => {
      this.startService();
    });
  }

  /**
   * Turn on local audio and video stream
   * 
   */
  private enableLocalStream(mediaStream: MediaStream) {
    // set the local stream with video and audio
    this.local.sourceObject = mediaStream;
    this.localStream = this.local.sourceObject;

    this.rtcService.addStream(mediaStream);
  }

  /**
   * Executes an action based on current connection state
   * 
   * @param connectionState the latest state of the webRTC conntection
   * 
   */
  private updateConnectionState(connectionState: string) {
    if (connectionState === this.currentConnectionState) {
      return;
    }

    // update the status service
    this.statusService.setStatus(connectionState);

    switch (connectionState) {
      case SEARCHING:
        this.showControls = true;
      case CONNECTED:
        this.analyticsService.trackEvent(CONNECTED, 'User connected to peer', CONNECTION_STATUS_EVENT);
        break;
      case DISCONNECTED:
        // ensure we are not calling stopService more than once
        if (this.currentConnectionState !== CLOSED && this.currentConnectionState !== FAILED) {
          this.analyticsService.trackEvent(DISCONNECTED, 'User disconnected from peer', CONNECTION_STATUS_EVENT);
          this.stopService();
        }
        break;
      case FAILED:
        // ensure we are not calling stopService more than once
        if (this.currentConnectionState !== CLOSED && this.currentConnectionState !== DISCONNECTED) {
          this.analyticsService.trackEvent(FAILED, 'Connection failed', CONNECTION_STATUS_EVENT);
          this.stopService();
        }
        break;
      case CLOSED:
        // ensure we are not calling stopService more than once
        if (this.currentConnectionState !== DISCONNECTED && this.currentConnectionState !== FAILED) {
          this.analyticsService.trackEvent(CLOSED, 'User closed connection to peer', CONNECTION_STATUS_EVENT);
          this.stopService();
        }
        break
      case PERMISSION_ERROR:
        this.openErrorSnackBar("Error: Couldn't obtain camera and/or microphone!");
        break;
      default:
        break;
    }

    // update the current connection state
    this.currentConnectionState = connectionState;
  }

  /**
   * Toggle local outgoing audio
   * 
   */
  public toggleMicrophone() {
    // if the user is not connected, do nothing
    if (!this.isConnected) {
      return;
    }

    let micStatus = this.localStream.getAudioTracks()[0].enabled;
    this.localStream.getAudioTracks()[0].enabled = !micStatus;

    if (!micStatus == true) {
      this.isMicEnabled = true;
      this.analyticsService.trackEvent(TOGGLE_MIC_ON, 'User toggled microphone on', BUTTON_CLICK_EVENT);
    } else {
      this.isMicEnabled = false;
      this.analyticsService.trackEvent(TOGGLE_MIC_OFF, 'User toggled microphone off', BUTTON_CLICK_EVENT);
    }
  }

  /**
   * Toggle local outgoing video
   * 
   */
  public toggleLocalVideo() {
    // if the user is not connected, do nothing    
    if (!this.isConnected) {
      return;
    }

    let videoStatus = this.localStream.getVideoTracks()[0].enabled;
    this.localStream.getVideoTracks()[0].enabled = !videoStatus;

    if (!videoStatus == true) {
      this.isVideoEnabled = true;
      this.analyticsService.trackEvent(TOGGLE_VIDEO_ON, 'User toggled video on', BUTTON_CLICK_EVENT);
    } else {
      this.isVideoEnabled = false;
      this.analyticsService.trackEvent(TOGGLE_VIDEO_OFF, 'User toggled video off', BUTTON_CLICK_EVENT);
    }
  }

  openErrorSnackBar(message: string) {
    this.snackBar.open(message, "", { duration: 5000, panelClass: ['red-snackbar'] });
  }
}
