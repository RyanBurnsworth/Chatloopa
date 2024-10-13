import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Room } from '../models/room.model';
import { Signal } from '../models/signal.model';
import { TurnServer } from '../models/turn-server.model';
import { Utils } from '../shared/utils';
import { RtcService } from './room.service';
import { SignalingService } from './signaling.service';
import * as uuid from 'uuid';

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

  private room$: any;

  constructor(
    private readonly signalingService: SignalingService, 
    private readonly rtcService: RtcService, ) { }

  public initVideoChat() {    
    this.room$ = this.rtcService.getSoloRoom().subscribe(
      (response) => {
        this.currentRoom = response;
        console.log(this.currentRoom);
        this.rtcService.currentRoom$.next(response); //TODO: Investigate

        console.log("Received RoomId: " + this.currentRoom.roomId + ". Starting signaling service and web rtc.");
        this.startSignalingService();
      },
      (error) => {
        this.peerErrorSubject.next("Failed to initiate services. Please try again.");
        console.error("Failed to initiate services: ", error.message);
      })
  }

  /**
   * Initialize the Web RTC functionality
   */
  public initWebRTC() {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
            {
              urls: "stun:relay.metered.ca:80",
            },
            {
              urls: "turn:relay.metered.ca:80",
              username: "71ae287c7eedae7b7b714043",
              credential: "e01q/DsuNEoUmGOM",
            },
            {
              urls: "turn:relay.metered.ca:443",
              username: "71ae287c7eedae7b7b714043",
              credential: "e01q/DsuNEoUmGOM",
            },
            {
              urls: "turn:relay.metered.ca:443?transport=tcp",
              username: "71ae287c7eedae7b7b714043",
              credential: "e01q/DsuNEoUmGOM",
            },
        ]
      },);
    } catch(error) {
      console.error(error);
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:relay.metered.ca:80",
          },
          {
            urls: "turn:relay.metered.ca:80",
            username: "71ae287c7eedae7b7b714043",
            credential: "e01q/DsuNEoUmGOM",
          },
          {
            urls: "turn:relay.metered.ca:443",
            username: "71ae287c7eedae7b7b714043",
            credential: "e01q/DsuNEoUmGOM",
          },
          {
            urls: "turn:relay.metered.ca:443?transport=tcp",
            username: "71ae287c7eedae7b7b714043",
            credential: "e01q/DsuNEoUmGOM",
          },
      ]
      },);
    }

    // turn on the local mic and camera
    this.localStreamSubject.next(true);

    this.peerConnection.onicecandidate = event => {
      let sig = new Signal();
      sig.id = uuid.v4();
      sig.message = JSON.stringify(event.candidate);
      sig.userId = this.userId;
      sig.type = "ICE_CANDIDATE";
      sig.timestamp = new Date();
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

    // TODO: If state becomes disconnected trigger endcall method
    // TODO: SPIKE: See if connecting... for too long results in a failed connection
    this.peerConnection.onconnectionstatechange = event => {
      console.log("Received connection state change event. Connection state change: " + event.currentTarget.connectionState);

      this.connectionStateSubject.next(event.currentTarget.connectionState);
      this.isConnected = (event.currentTarget.connectionState === 'connected');
    }

    this.peerConnection.onicecandidateerror = event => {
      console.error("Received IceCandidateError event. Ice candidate error: " + event.currentTarget.error);
    }
  }

  private startSignalingService() {
    // if no 2nd user exists in the room, this user is the initiator
    this.isInitiator = this.currentRoom.userTwoId === "";

    let signal = new Signal();
    signal.message = "";
    signal.id = uuid.v4();
    
    if (this.isInitiator) {
      // create a Firestore document for this room
      signal.type = "CREATE_ROOM";
      this.userId = this.currentRoom.userOneId;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.roomId;
      signal.timestamp = new Date();

      console.log("Sending CREATE_ROOM signal");
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);
    } else {
      // send the JOIN_ROOM signal to Firestore
      signal.type = "JOIN_ROOM";
      this.userId = this.currentRoom.userTwoId;
      signal.userId = this.userId;
      signal.roomId = this.currentRoom.roomId;
      signal.timestamp = new Date();

      console.log("Sending JOIN_ROOM signal");
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);

      this.currentRoom.joinTime = new Date().toString();
      this.rtcService.updateRoom(this.currentRoom).subscribe((room) => {
        this.currentRoom = room;
      });
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
              return;
            }
            
            // validate the room ids match
            if (this.signal.roomId !== this.currentRoom.roomId) {
              return;
            }
              
            this.signalCache.push(this.signal);
            this.signalResolver();
          })
        },
        (error) => {
          console.error("Error receiving signal: " + error.error);
        }
      )
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
          this.peerConnection.createOffer().then(
            (offer) => { 
              this.peerConnection.setLocalDescription(offer).then(
                () => {
                  let offerSignal = new Signal();
                  offerSignal.id = uuid.v4();
                  offerSignal.message = JSON.stringify(offer);
                  offerSignal.userId = this.userId;
                  offerSignal.type = "OFFER";
                  offerSignal.roomId = this.currentRoom.roomId;
                  offerSignal.timestamp = new Date();

                  this.signalingService.sendSignal(this.currentRoom.roomId, offerSignal)
                },
                (error) => {
                  this.peerErrorSubject.next("Failed to establish a connection with peer.")
                  this.closeConnection();
                }
              );
            },
            (error) => {
              console.error("Error creating offer: " + error.error),
              this.peerErrorSubject.next("Failed to establish a connection with peer.");
              this.closeConnection();
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
                sig.id = uuid.v4();
                sig.message = JSON.stringify(answer);
                sig.type = "ANSWER";
                sig.userId = this.userId;
                sig.roomId = this.currentRoom.roomId;
                sig.timestamp = new Date();

                this.signalingService.sendSignal(this.currentRoom.roomId, sig);
              },
              (error) => {
                this.peerErrorSubject.next("Failed to establish a connection with peer.");
                this.closeConnection();
              }
            );
          },
          (error) => {
            this.peerErrorSubject.next("Failed to establish a connection with peer.");
            this.closeConnection();
          },
        );
        break;
      case "ANSWER":
        let remoteDesc = Utils.sdpTransform(this.signal.message);
        this.peerConnection.setRemoteDescription(remoteDesc).then(
          () => {
            console.log("Received");
          },
          (error) => {
            this.peerErrorSubject.next("Failed to establish a connection with peer.");
            this.closeConnection();
          }
        );
        break;
      case "ICE_CANDIDATE":
        if (this.signal.message == 'null')
          return;
        
        console.log("Received ICE candidate");

        let iceCandidate = Utils.iceCandidateTransform(this.signal.message);
        this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate))
          .catch((error) => console.error("Error adding ice candidate: " + error.message));
        break;
      case "CLOSED":
        this.closeConnection();
        this.connectionStateSubject.next("disconnected") // signal the UI of the disconnect
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
    this.isConnected = false;
    try {
      this.peerConnection.close()
      this.destroy();
    } catch (err) {
      // the connection may have already been closed
    };
  }

  public sendEndChatSignal() {
    try {
      let sig = new Signal();
      sig.id = uuid.v4();
      sig.message = "";
      sig.type = "CLOSED";
      sig.userId = this.userId;
      sig.roomId = this.currentRoom.roomId;
      sig.timestamp = new Date();

      this.signalingService.sendSignal(this.currentRoom.roomId, sig);

      this.currentRoom.endTime = new Date().toString();
      this.rtcService.updateRoom(this.currentRoom).subscribe((room) => {
        this.currentRoom = room;
      });
    } catch (err) {
        // error retrieving the items needed to send a signal
    }
  }

  private destroy() {
    try {
      this.peerConnection = undefined;
      this.currentRoom = undefined;
      if (this.signalObservable$) {
        this.signalObservable$.unsubscribe();
      }

      if (this.room$) {
        this.room$.unsubscribe();
      }
    } catch (err) {
      console.error("Error destroying connection: " + err.message);
    }
  }
}
