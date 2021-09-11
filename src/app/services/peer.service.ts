import { Injectable } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { Room } from '../models/room.model';
import { Signal } from '../models/signal.model';
import { TurnServer } from '../models/turn-server.model';
import { Utils } from '../shared/utils';
import { RoomService } from './room.service';
import { SignalingService } from './signaling.service';
import { take, map, filter } from 'rxjs/operators'

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

  private waitTimer$ = interval(1000).pipe(
    map((x) => x + 1),
    filter((y) => y == 10),
    take(10),
  );
  private waitTimer: any;

  private roomService$: any;

  constructor(
    private readonly signalingService: SignalingService, 
    private readonly roomService: RoomService, ) { }

  public initPeerService() {
    this.roomService$ = this.roomService.getRoom().subscribe(
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

      this.waitTimer = this.waitTimer$.subscribe((timeElapsed) => {
        if (!this.isConnected) {
          console.log('Connection Timeout - Retrying');
          this.closeConnection();
          this.initPeerService();
        }
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
      signal.roomId = this.currentRoom.room_id;

      this.signalingService.sendSignal(this.currentRoom.room_id, signal);
    } else {
      signal.type = "JOIN_ROOM";
      this.userId = this.currentRoom.user_id_2;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.room_id;

      this.signalingService.sendSignal(this.currentRoom.room_id, signal);
    }

    this.signalingService.startSignalListener(this.currentRoom.room_id);
    this.signalObservable$ = this.signalingService.getSignalListener().subscribe(
        (resp) => {
          resp.map(changes => {
            this.signal = changes.payload.doc.data() as Signal;
            if (Utils.compareSignals(this.signal, this.signalCache) || this.signal.roomId !== this.currentRoom.room_id)
              return;
            this.signalCache.push(this.signal);
            this.signalReceived();
          })
        },
        (error) => {
          this.peerErrorSubject.next("Error processing request.");
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
      sig.roomId = this.currentRoom.room_id;
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
      this.isConnected = (event.currentTarget.connectionState === 'connected');
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
                  offerSignal.roomId = this.currentRoom.room_id;
                  this.signalingService.sendSignal(this.currentRoom.room_id, offerSignal)
                },
                (error) => {
                  this.peerErrorSubject.next("We have encountered an error.")
                  console.error("Error setting local description: " + error.error);
                  this.restartConnection();
                }
              );
            },
            (error) => {
              console.error("Error creating offer: " + error.error),
              this.peerErrorSubject.next("We have encountered an error");
              this.restartConnection();
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
                sig.roomId = this.currentRoom.room_id;
                this.signalingService.sendSignal(this.currentRoom.room_id, sig);
              },
              (error) => {
                this.peerErrorSubject.next("We have encountered an error");
                console.error("Error setting local desc: " + error.error);
                this.restartConnection();
              }
            );
          },
          (error) => {
            this.peerErrorSubject.next("We have encounted an error.");
            console.error("Error creating answer: " + JSON.stringify(error));
            this.restartConnection();
          },
        );
        break;
      case "ANSWER":
        let remoteDesc = Utils.sdpTransform(this.signal.message);
        this.peerConnection.setRemoteDescription(remoteDesc).then(
          () => {
            
          },
          (error) => {
            this.peerErrorSubject.next("We have encountered an error");
            console.error("Error setting remote description: " + error);
            this.restartConnection();
          }
        );
        break;
      case "ICE_CANDIDATE":
        if (this.signal.message == 'null')
          return;

        let iceCandidate = Utils.iceCandidateTransform(this.signal.message);
        this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate))
          .catch((error) => console.log("Error adding ice candidate: " + error));
        break;
      case "CLOSED":
        this.connectionStateSubject.next('disconnected');
        this.isConnected = false;
        break;
      default:
        break;
    }
  }

  public addStream(stream) {
    this.peerConnection.addStream(stream);
  }

  private restartConnection() {
    this.closeConnection();
    this.initPeerService();
  }

  /**
   * End the current webRTC peer connection
   * 
   */
   public closeConnection() {
    this.isConnected = false;
    this.signal.type="CLOSED";
    this.signalingService.sendSignal(this.currentRoom.room_id, this.signal);
    this.peerConnection.close()
    this.destroy();
  }

  private destroy() {
    this.peerConnection = undefined;
    this.currentRoom = undefined;
    this.signalObservable$.unsubscribe();
    this.waitTimer.unsubscribe();
    this.roomService$.unsubscribe();
  }
}
