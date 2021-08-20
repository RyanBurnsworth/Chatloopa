import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Room } from '../models/room.model';
import { Signal } from '../models/signal.model';
import { TurnServer } from '../models/turn-server.model';
import { Utils } from '../shared/utils';
import { RoomService } from './room.service';
import { SignalingService } from './signaling.service';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  userId = '';
  currentRoom : Room;
  signal: Signal;
  turnServer: TurnServer;
  isInitiator = false;
  peerConnection: any;
  signalCache: Signal[] = [];
  isConnected = false;

  private peerErrorSubject = new Subject();
  peerError$ = this.peerErrorSubject.asObservable();

  private remoteStreamSubject = new Subject();
  remoteStream$ = this.remoteStreamSubject.asObservable();

  private localStreamSubject = new Subject();
  localStream$ = this.localStreamSubject.asObservable();

  private connectionStateSubject = new Subject();
  connectionState$ = this.connectionStateSubject.asObservable();

  constructor(
    private readonly signalingService: SignalingService, 
    private readonly roomService: RoomService, ) { }

  public initPeerService() {
    this.roomService.getRoom().subscribe(
      (response) => {
        this.currentRoom = response;
        this.roomService.currentRoom$.next(response); //TODO: Investigate
        this.startSignalingService();
        this.initWebRTC();
      },
      (error) => {
        this.peerErrorSubject.next("Oops we\'ve encountered an error. Try again.");
        console.error("Error fetching room");
      })
  }

  private startSignalingService() {
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
            this.signalReceived();
          })
        },
        (error) => {
          this.peerErrorSubject.next("Oops...we have a problem! Please try again.");
          console.error("Error receiving signal: " + error.error);
        }
      )
  }

  private initWebRTC() {
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
    this.localStreamSubject.next(true);

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
      this.remoteStreamSubject.next(event.streams[0]);
    };

    this.peerConnection.onconnectionstatechange = event => {
      this.connectionStateSubject.next(event.currentTarget.connectionState);
    }

    this.peerConnection.onicecandidateerror = event => {
      console.error("Ice candidate error: " + event);
    }
  }

  private signalReceived() {
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
                (error) => {
                  this.peerErrorSubject.next("Oops we\'ve encountered an error. Try again.")
                  console.error("Error setting local description: " + error.error);
                }
              );
            },
            (error) => {
              console.error("Error creating offer: " + error.error),
              this.peerErrorSubject.next("Oops, we\'ve encounted an error. Try again");
            }
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
              (error) => {
                this.peerErrorSubject.next("Oops, we\'ve encounted an error. Try again");
                console.error("Error setting local desc: " + error.error);
              }
            );
          },
          (error) => {
            this.peerErrorSubject.next("Oops, we\'ve encounted an error. Try again");
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
      case "CLOSED":
        this.connectionStateSubject.next('disconnected');
        break;
      default:
        break;
    }
  }

  public addStream(stream) {
    this.peerConnection.addStream(stream);
  }

  /**
   * End the current webRTC peer connection
   * 
   */
   public closeConnection() {
    this.signal.type="CLOSED";
    this.signalingService.sendSignal(this.currentRoom.room_id, this.signal);
    this.peerConnection.close()
    this.peerConnection = undefined;
    this.roomService.currentRoom$.next(undefined);
  }
}
