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

  signalObservable$: any;
  
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
    console.log("WEBRTCLOG: " + "Initializing Peer Service"); // TODO: Remove comment
    this.roomService.getRoom().subscribe(
      (response) => {
        console.log("WEBRTCLOG: " + "Received Room Response"); //TODO: Remove Comment
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
    console.log("WEBRTCLOG: " + "Starting Signaling Service"); //TODO: Remove Comment
    // if no 2nd user exists in the room, this user is the initiator
    this.isInitiator = this.currentRoom.user_id_2 === "";

    // if isInitiator, add document to Firestore collection for CREATE_ROOM
    let signal = new Signal();
    signal.message = "";
    if (this.isInitiator) {
      console.log("WEBRTCLOG: " + "Is Initiator"); //TODO: Remove Comment
      signal.type = "CREATE_ROOM";
      this.userId = this.currentRoom.user_id_1;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.room_id;

      this.signalingService.sendSignal(this.currentRoom.room_id, signal);
    } else {
      console.log("WEBRTCLOG: " + "Is Joining Room"); //TODO: Remove Comment
      signal.type = "JOIN_ROOM";
      this.userId = this.currentRoom.user_id_2;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.room_id;

      this.signalingService.sendSignal(this.currentRoom.room_id, signal);
    }

    this.signalingService.startSignalListener(this.currentRoom.room_id);
    this.signalObservable$ = this.signalingService.getSignalListener().subscribe(
        (resp) => {
          console.log("WEBRTCLOG: " + "Incoming Signal"); //TODO: Remove Comment
          resp.map(changes => {
            this.signal = changes.payload.doc.data() as Signal;
            console.log("WEBRTCLOG: " + "SignalRoom: " + this.signal.roomId + " CurrentRoom: " + this.currentRoom.room_id); //TODO: Remove Log
            if (Utils.compareSignals(this.signal, this.signalCache) || this.signal.roomId !== this.currentRoom.room_id)
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
    console.log("WEBRTCLOG: " + "Initialzing WebRTC "); //TODO: Remove Comment
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
      console.log("WEBRTCLOG: " + "Received Ice Candidate"); //TODO: Remove Comment
      let sig = new Signal();
      sig.message = JSON.stringify(event.candidate);
      sig.userId = this.userId;
      sig.type = "ICE_CANDIDATE";
      sig.roomId = this.currentRoom.room_id;
      this.signalingService.sendSignal(this.currentRoom.room_id, sig);
    };

    this.peerConnection.onremovestream = event => {
      console.log ("Peer has left the chat");
    };

    this.peerConnection.ontrack = event => {
      console.log("WEBRTCLOG: " + "Received Remote track"); //TODO: Remove Comment
      this.remoteStreamSubject.next(event.streams[0]);
    };

    this.peerConnection.onconnectionstatechange = event => {
      console.log("WEBRTCLOG: " + "Connection change event "); //TODO: Remove Comment
      this.connectionStateSubject.next(event.currentTarget.connectionState);
    }

    this.peerConnection.onicecandidateerror = event => {
      console.log("WEBRTCLOG: " + "Ice candidate error"); //TODO: Remove Comment
      console.error("Ice candidate error: " + event);
    }
  }

  private signalReceived() {
    console.log("WEBRTCLOG: " + "New Signal received "); //TODO: Remove Comment
    // ignore signal messages from self
    if (this.signal.userId === this.userId) {
      return;
    }
    
    switch (this.signal.type) {
      case "JOIN_ROOM":
        console.log("WEBRTCLOG: " + "Joining Room: " + this.currentRoom.room_id); //TODO: Remove Comment
        if (this.isInitiator) {
          this.peerConnection.createOffer().then(
            (offer) => { 
              this.peerConnection.setLocalDescription(offer).then(
                () => {
                  let offerSignal = new Signal();
                  offerSignal.message = JSON.stringify(offer);
                  offerSignal.userId = this.userId;
                  offerSignal.type = "OFFER";
                  offerSignal.roomId = this.currentRoom.room_id;
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
        console.log("WEBRTCLOG: " + "Receiving an offer"); //TODO: Remove Comment
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
                sig.roomId = this.currentRoom.room_id;
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
        console.log("WEBRTCLOG: " + "Received an answer "); //TODO: Remove Comment
        let remoteDesc = Utils.sdpTransform(this.signal.message);
        this.peerConnection.setRemoteDescription(remoteDesc);
        break;
      case "ICE_CANDIDATE":
        console.log("WEBRTCLOG: " + "Incoming Ice Candidate"); //TODO: Remove Comment
        if (this.signal.message == 'null')
          return;

        let iceCandidate = Utils.iceCandidateTransform(this.signal.message);
        this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate))
          .catch((error) => console.log("Error adding ice candidate: " + error));
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
    console.log("WEBRTCLOG: " + "Closing connection"); //TODO: Remove Comment
    this.signal.type="CLOSED";
    this.signalingService.sendSignal(this.currentRoom.room_id, this.signal);
    this.peerConnection.close()
    this.peerConnection = undefined;
    this.currentRoom.room_id = '';
    this.signalObservable$.unsubscribe();
    this.roomService.currentRoom$.next(undefined);
  }
}
