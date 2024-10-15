import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { InteractionService } from 'src/app/services/interaction.service';
import { MediaControllerService } from 'src/app/services/media-controller.service';
import { PeerService } from 'src/app/services/peer.service';
import { RtcService } from 'src/app/services/rtc.service';
import { ServiceStatusService } from 'src/app/services/service-status.service';
import { StatusService } from 'src/app/services/status.service';
import { DISCONNECTED, SEARCHING, START_CHAT, BUTTON_CLICK_EVENT, STOP_CHAT, CONNECTED, CONNECTION_STATUS_EVENT, CLOSED, FAILED, PERMISSION_ERROR, TOGGLE_MIC_ON, TOGGLE_MIC_OFF, TOGGLE_VIDEO_ON, TOGGLE_VIDEO_OFF, CONNECTING, STARTED, STOPPED, EMOJI, SEND_EMOJI } from 'src/app/shared/constants';

@Component({
  selector: 'app-video-text',
  standalone: false,
  templateUrl: './video-text.component.html',
  styleUrl: './video-text.component.scss'
})
export class VideoTextComponent implements OnInit, AfterViewChecked {
  @ViewChild("local") local: any;
  @ViewChild("remote") remote: any;
  @ViewChild('messagesContainer', { static: false }) private messagesContainer!: ElementRef;

  private isConnected = false;
  private numberOfViewChecks = 0;
  private currentConnectionState = DISCONNECTED;

  public localStream: MediaStream;
  public roomId = '';
  public localUser = '';
  public remoteUser = '';
  public showControls = false;

  public isMicEnabled = true;
  public isVideoEnabled = true;

  // boolean for the emoji animation
  public isRemoteAnimationVisible = false;
  public isLocalAnimationVisible = false;

  constructor(
    private readonly rtcService: RtcService,
    private readonly peerService: PeerService,
    private readonly analyticsService: AnalyticsService,
    private readonly mediaControllerService: MediaControllerService,
    private readonly statusService: StatusService,
    private readonly serviceStatusService: ServiceStatusService,
    private readonly interactionService: InteractionService,
    private readonly router: Router,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.checkScreenSize();

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

    this.interactionService.getInteraction().subscribe((interaction) => {
      if (interaction === EMOJI) {
        this.showLocalAnimation();
      }
    });
  }

  ngAfterViewChecked() {
    // we want to stop scrolling this item after 10 view checks
    if (this.numberOfViewChecks < 10) {
      this.scrollToBottom();
      this.numberOfViewChecks++;
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;

      container.scrollTop = container.scrollHeight;
    }
  }

  private checkScreenSize(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // If screen width is less than 800px OR screen height is less than 500px
    if (screenWidth < 800 || screenHeight < 500) {
      // Redirect to the mobile-friendly page
      this.router.navigate(['']); // Replace with your desired mobile-friendly route
    }
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
    if (this.isConnected) {
      this.stopService();
    }

    this.isConnected = true;

    // set the service status
    this.serviceStatusService.updateServiceStatus(STARTED);

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
  public stopService() {
    // turn off the camera and mic
    if (this.localStream) {
      this.localStream.getVideoTracks()[0].enabled = false;
      this.localStream.getAudioTracks()[0].enabled = false;

      this.isMicEnabled = false;
      this.isVideoEnabled = false;
    }

    this.isConnected = false;

    // update the service status
    this.serviceStatusService.updateServiceStatus(STOPPED);

    this.rtcService.closeConnection();

    if (this.local) {
      this.local.sourceObject = null;
    }

    if (this.remote) {
      this.remote.sourceObject = null;
    }

    // this will clear the message box
    this.roomId = '';
    this.localUser = '';
    this.remoteUser = '';

    this.analyticsService.trackEvent(STOP_CHAT, 'User stopped the current chat', BUTTON_CLICK_EVENT);
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
        break;
      case CONNECTED:
        // once connected update the roomId, localUser and remoteUser to enable chatting
        this.updateChatInfo();
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

  public showLocalAnimation() {
    if(!this.isConnected || this.isRemoteAnimationVisible) {
      return;
    }

    this.isLocalAnimationVisible = true;

    // hide the animation after 2 seconds
    setTimeout(() => {
      this.isLocalAnimationVisible = false;
    }, 2000);
  }

  public showRemoteAnimation() {
    if(!this.isConnected) {
      return;
    }

    // emit interaction to message service to send request to show emoji remotely
    this.interactionService.emitInteraction(SEND_EMOJI)

    this.isRemoteAnimationVisible = true;

    // hide the animation after 2 seconds
    setTimeout(() => {
      this.isRemoteAnimationVisible = false;
    }, 2000); 
  }

  private updateChatInfo() {
    const room = this.peerService.currentRoom;

    this.roomId = room.roomId + '-chat';

    if (room.isInitiator) {
      this.localUser = room.userOneId;
      this.remoteUser = room.userTwoId;
    } else {
      this.localUser = room.userTwoId;
      this.remoteUser = room.userOneId;
    }
  }

  private openErrorSnackBar(message: string) {
    this.snackBar.open(message, "", { duration: 5000, panelClass: ['red-snackbar'] });
  }
}
