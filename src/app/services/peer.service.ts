import { Injectable } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { Room } from '../models/room.model';
import { Signal } from '../models/signal.model';
import { TurnServer } from '../models/turn-server.model';
import { Utils } from '../shared/utils';
import { RtcService } from './room.service';
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

  private room$: any;

  constructor(
    private readonly signalingService: SignalingService, 
    private readonly rtcService: RtcService, ) { }

  public initPeerService() {
    
    this.room$ = this.rtcService.getSoloRoom().subscribe(
      (response) => {
        this.currentRoom = response;
        this.rtcService.currentRoom$.next(response); //TODO: Investigate

        console.log("Received RoomId: " + this.currentRoom.roomId + ". Starting signaling service and web rtc.");
        this.startSignalingService();
        this.initWebRTC();
      },
      (error) => {
        this.peerErrorSubject.next("Oops we\'ve encountered an error. Try again.");
        console.error("Error fetching room: ", error.message);
      })

      // this.waitTimer = this.waitTimer$.subscribe((timeElapsed) => {
      //   if (!this.isConnected) {
      //     console.log('Connection Timeout - Retrying');
      //     this.closeConnection();
      //     this.initPeerService();
      //   }
      // })
  }

  private startSignalingService() {
    // if no 2nd user exists in the room, this user is the initiator
    this.isInitiator = this.currentRoom.userTwoId === "";

    let signal = new Signal();
    signal.message = "";
    if (this.isInitiator) {
      // create a Firestore document for this room
      signal.type = "CREATE_ROOM";
      this.userId = this.currentRoom.userOneId;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.roomId;

      console.log("Sending CREATE_ROOM signal");
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);
    } else {
      // send the JOIN_ROOM signal to Firestore
      signal.type = "JOIN_ROOM";
      this.userId = this.currentRoom.userTwoId;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.roomId;

      console.log("Sending JOIN_ROOM signal");
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);
    }

    // start the Firestore listener to listen for incoming signals
    this.signalingService.startSignalListener(this.currentRoom.roomId);

    // 
    this.signalObservable$ = this.signalingService.getSignalListener().subscribe(
        (resp) => {
          resp.map(changes => {
            // extract the signal data
            this.signal = changes.payload.doc.data() as Signal;

            // validate the latest incoming signal is not the same as the last
            if (Utils.compareSignals(this.signal, this.signalCache))  {
              console.warn("Incoming signal matches previous signal");
              return;
            }
            
            // validate the room ids match
            if (this.signal.roomId !== this.currentRoom.roomId) {
              console.warn("Incoming signal was for wrong room: Your roomId: " + this.currentRoom.roomId + " Incoming roomId: " + this.signal.roomId);
              return;
            }
              
            this.signalCache.push(this.signal);
            this.signalResolver();
          })
        },
        (error) => {
          this.peerErrorSubject.next("Error processing request.");
          console.error("Error receiving signal: " + error.error);
        }
      )
  }

  /**
   * Initialize the Web RTC functionality
   */
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
      sig.roomId = this.currentRoom.roomId;

      console.log("Received ICE_CANDIDATE event. Sending signal");
      this.signalingService.sendSignal(this.currentRoom.roomId, sig);
    };

    this.peerConnection.onremovestream = event => {
      console.log ("Received Remove_Stream event. Peer has left the chat?");
    };

    this.peerConnection.ontrack = event => {
      console.log("Received On_Track event. Setting remote peer video stream");
      this.remoteStreamSubject.next(event.streams[0]);
    };

    this.peerConnection.onconnectionstatechange = event => {
      console.log("Received connection state change event. Connection state change: " + event.currentTarget.connectionState);

      this.connectionStateSubject.next(event.currentTarget.connectionState);
      this.isConnected = (event.currentTarget.connectionState === 'connected');
    }

    this.peerConnection.onicecandidateerror = event => {
      console.warn("Received IceCandidateError event. Ice candidate error: " + event);
    }
  }

  /**
   * Resolve incoming signals from Firestore 
   * @returns 
   */
  private signalResolver() {
    // ignore signal messages from self
    if (this.signal.userId === this.userId) {
      return;
    }
    
    switch (this.signal.type) {
      case "JOIN_ROOM":
        if (this.isInitiator) {
          console.log("A peer is joining the room...");
          this.peerConnection.createOffer().then(
            (offer) => { 
              this.peerConnection.setLocalDescription(offer).then(
                () => {
                  let offerSignal = new Signal();
                  offerSignal.message = JSON.stringify(offer);
                  offerSignal.userId = this.userId;
                  offerSignal.type = "OFFER";
                  offerSignal.roomId = this.currentRoom.roomId;

                  console.log("Sending offer");
                  this.signalingService.sendSignal(this.currentRoom.roomId, offerSignal)
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

        console.log("Received an OFFER signal");
        this.peerConnection.createAnswer().then(
          (answer) => {
            this.peerConnection.setLocalDescription(answer).then(
              () => {
                let sig = new Signal();
                sig.message = JSON.stringify(answer);
                sig.type = "ANSWER";
                sig.userId = this.userId;
                sig.roomId = this.currentRoom.roomId;

                console.log("Sending an ANSWER");
                this.signalingService.sendSignal(this.currentRoom.roomId, sig);
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
            console.log("Received an ANSWER signal");
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
        
        console.log("Received ICE candidate");

        let iceCandidate = Utils.iceCandidateTransform(this.signal.message);
        this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate))
          .catch((error) => console.log("Error adding ice candidate: " + error));
        break;
      default:
        break;
    }
  }

  public addStream(stream) {
    console.log("adding stream");
    this.peerConnection.addStream(stream);
  }

  private restartConnection() {
    console.log("Restarting connection...");
    this.closeConnection();
    this.initPeerService();
  }

  /**
   * End the current webRTC peer connection
   * 
   */
   public closeConnection() {
    console.log("Closing connection...");
    this.isConnected = false;
    this.signal.type="CLOSED";
    this.signalingService.sendSignal(this.currentRoom.roomId, this.signal);
    this.peerConnection.close()
    this.destroy();
  }

  private destroy() {
    console.log("Destroying connection...");
    this.peerConnection = undefined;
    this.currentRoom = undefined;
    this.signalObservable$.unsubscribe();
    this.waitTimer.unsubscribe();
    this.room$.unsubscribe();
  }
}
