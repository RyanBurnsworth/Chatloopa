import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { Room } from '../models/room.model';
import { Signal } from '../models/signal.model';
import { TurnServer } from '../models/turn-server.model';
import { DialogService } from '../services/dialog.service';
import { LoadingService } from '../services/loading.service';
import { RoomService } from '../services/room.service';
import { SignalingService } from '../services/signaling.service';
import { Utils } from '../shared/utils';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-web-conference',
  templateUrl: './web-conference.component.html',
  styleUrls: ['./web-conference.component.scss']
})
export class WebConferenceComponent implements OnDestroy {
  userId = '';
  currentRoom : Room;
  turnServer: TurnServer;
  isInitiator = false;
  signal: Signal;
  peerConnection: any;
  localStream: any;
  signalCache: Signal[] = [];
  isConnected = false;

  micSubject$ = new BehaviorSubject('mic');
  videoSubject$ = new BehaviorSubject('videocam');

  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  @ViewChild("local") local : any;
  @ViewChild("remote") remote: any;

  constructor(
    private readonly signalingService: SignalingService, 
    private readonly roomService: RoomService, 
    private readonly loadingService: LoadingService,
    private readonly dialogService: DialogService, 
    private readonly snackBar: MatSnackBar) { }

  ngOnDestroy(): void {
    let sig = new Signal();
    sig.userId = this.userId;
    sig.type = "CLOSE";
    sig.message = "";
    this.signalingService.sendSignal(this.currentRoom.room_id, sig);
    this.closeConnection();

    this.micSubject$.unsubscribe();
    this.videoSubject$.unsubscribe();
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

    this.roomService.getRoom().subscribe(
      (response) => {
        this.currentRoom = response;
        this.roomService.currentRoom$.next(response);
        this.initializeSignaling();
        this.initializeWebRTC();
      },
      (error) => {
        console.error("Error getting room name! ") + JSON.stringify(error);
      })
  }

  /**
   * Initializes the signaling server listener 
   * and begins listening for updates
   * 
   */
  private initializeSignaling() {
    // if no 2nd user exists in the room, this user is the initiator
    this.isInitiator = this.currentRoom.user_id_2 === "";

    // if isInitiator, add document to Firestore collection for CREATE_ROOM
    let signal = new Signal();
    signal.message = "";
    if (this.isInitiator) {
      signal.type = "CREATE_ROOM";
      this.userId = this.currentRoom.user_id_1;
      signal.userId = this.userId;

      this.signalingService.sendSignal(this.currentRoom.room_id, signal);
    } else {
      signal.type = "JOIN_ROOM";
      this.userId = this.currentRoom.user_id_2;
      signal.userId = this.userId;

      this.signalingService.sendSignal(this.currentRoom.room_id, signal);
    }

    this.signalingService.getSignalListener(this.currentRoom.room_id)
    .subscribe(
        (resp) => {
          resp.map(changes => {
            this.signal = changes.payload.doc.data() as Signal;
            if (Utils.compareSignals(this.signal, this.signalCache))
              return;
            this.signalCache.push(this.signal);
            this.processIncomingSignal();
          })
        },
        (error) => {
          console.error("Error retrieving signal: " + JSON.stringify(error));
        }
      )
  }

  /**
   * Initializes the Peer Connection and listens for changes to it's properties
   * 
   */
  private initializeWebRTC() {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.services.mozilla.com" },
          { urls: "stun:stun.l.google.com:19302" }
        ]
      },);
    } catch(error) {
      console.error(error);
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.services.mozilla.com" },
          { urls: "stun:stun.l.google.com:19302" }
        ]
      },);
    }

    // turn on the local mic and camera
    this.enableLocalStream();

    this.peerConnection.onicecandidate = event => {
      let sig = new Signal();
      sig.message = JSON.stringify(event.candidate);
      sig.userId = this.userId;
      sig.type = "ICE_CANDIDATE";
      this.signalingService.sendSignal(this.currentRoom.room_id, sig);
    };

    this.peerConnection.onremovestream = event => {
      console.log ("Peer has left the chat");
    };

    this.peerConnection.ontrack = event => {
        this.remote.sourceObject = event.streams[0];
    };

    this.peerConnection.onconnectionstatechange = event => {
      let connectionState: string = event.currentTarget.connectionState;
      this.updateConnectionState(connectionState);
    }
  }

  /**
   * Executes action based on Signal.type
   *  
   */
  private processIncomingSignal() {
    // ignore signal messages from self
    if (this.signal.userId === this.userId) {
      return;
    }
    
    switch (this.signal.type) {
      case "JOIN_ROOM":
        if (this.isInitiator) {
          this.peerConnection.createOffer().then(
            (offer) => { 
              this.peerConnection.setLocalDescription(offer).then(
                () => {
                  let offerSignal = new Signal();
                  offerSignal.message = JSON.stringify(offer);
                  offerSignal.userId = this.userId;
                  offerSignal.type = "OFFER";
                  this.signalingService.sendSignal(this.currentRoom.room_id, offerSignal)
                },
                (error) => console.error("Error setting local description: " + JSON.stringify(error)),
              );
            },
            (error) => console.error("Error creating offer: " + JSON.stringify(error)),
          );
        }
        break;
      case "OFFER":
        let rtcSessionDescInit = Utils.sdpTransform(this.signal.message);
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(rtcSessionDescInit))

        this.peerConnection.createAnswer().then(
          (answer) => {
            this.peerConnection.setLocalDescription(answer).then(
              () => {
                let sig = new Signal();
                sig.message = JSON.stringify(answer);
                sig.type = "ANSWER";
                sig.userId = this.userId;
                this.signalingService.sendSignal(this.currentRoom.room_id, sig);
              },
              (error) => console.error("Error setting local desc: " + JSON.stringify(error)),
            );
          },
          (error) => {
            console.error("Error creating answer: " + JSON.stringify(error));
          },
        );
        break;
      case "ANSWER":
        let remoteDesc = Utils.sdpTransform(this.signal.message);
        this.peerConnection.setRemoteDescription(remoteDesc);
        break;
      case "ICE_CANDIDATE":
        if (this.signal.message == 'null')
          return;

        let iceCandidate = Utils.iceCandidateTransform(this.signal.message);
        this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
        break;
      case "CLOSE":
        this.closeConnection();
        break;
      default:
        break;
    }
  }

  /**
   * Turn on local audio and video stream
   * 
   */
  private enableLocalStream() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        this.local.sourceObject = stream;
        this.peerConnection.addStream(stream);
        this.localStream = stream;
      })
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
        this.closeConnection();
        this.showSnackBar('Peer Left The Chat');
        break;
      default:
        break;
    }
  }

  /**
   * Reset the UI components
   * 
   */
  private reset() {
    this.loadingService.setLoadingStatus(false);
    this.isConnected = false;
    this.micSubject$.next('mic');
    this.videoSubject$.next('videocam');
    this.localStream.getVideoTracks()[0].enabled = false;
    this.localStream.getAudioTracks()[0].enabled = false;
  }
  
  /**
   * End the current webRTC peer connection
   * 
   */
  public closeConnection() {
    this.reset();
    
    this.peerConnection.close()
    this.localStream = undefined;
    this.local.sourceObject = undefined;
    this.remote.sourceObject = undefined;
    this.peerConnection = undefined;
    this.roomService.currentRoom$.next(undefined);
    console.log("Disconnected!");
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

  showEndChatDialog() {
    let data = {icon: '', title: 'Are you sure?', message: 'Do you want to end this video chat?', positiveButtonText: 'Leave Video Chat', negativeButtonText: 'Cancel' };
    this.dialogService.openActionDialog(data);

    this.dialogService.event$.subscribe((event) => {
      switch (event) {
        case 'positive':
          this.closeConnection();
          break;
        case 'negative':
          break;
        default:
          break;
      }
    })
  }

  showWaitingDialog() {
    let data = {icon: '', title: 'Waiting for a Video Stranger', message: 'Hang tight, we\'ll find you someone soon!'};
    this.dialogService.openProgressDialog(data);
  }

  showSnackBar(message: string, ) {
    this.snackBar.open(message, '', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }
}
