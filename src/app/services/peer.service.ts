import { Injectable } from '@angular/core';
import { Room } from '../models/room.model';
import { Signal } from '../models/signal.model';
import { Utils } from '../shared/utils';
import { RoomService } from './room.service';
import { SignalingService } from './signaling.service';
import { ANSWER, CLOSED, CREATE_ROOM, ICE_CANDIDATE, JOIN_ROOM, OFFER } from '../shared/constants';
import { RtcService } from './rtc.service';
import { StatusService } from './status.service';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  userId = '';
  isInitiator = false;

  currentRoom: Room;
  signalCache: Signal[] = [];
  peerConnection: RTCPeerConnection;

  constructor(
    private readonly rtcService: RtcService,
    private readonly roomService: RoomService,
    private readonly signalingService: SignalingService,
    private readonly statusService: StatusService,) { }

  /**
   * Register a room with the service
   */
  public registerRoom() {
    this.roomService.getSoloRoom().subscribe(
      (response) => {
        this.currentRoom = response;
        this.roomService.currentRoom$.next(response);

        console.log("Received RoomId: " + this.currentRoom.roomId);

        // create or join the room
        this.createOrJoinRoom();

        // setup the WebRTC connection event listeners
        this.rtcService.setupRTCConnectionEventListeners(this.userId, this.currentRoom.roomId);

        // start the signal listener
        this.startListener();
        
      },
      (error) => {
        console.error("Failed to initiate services: ", error.message);
      });
  }

  /**
   * Resolve incoming signals from Firestore 
   * @returns 
   */
  private handleSignal(signal: Signal) {
    // ignore signal messages from self
    if (signal.userId === this.userId) {
      return;
    }

    switch (signal.type) {
      case JOIN_ROOM:
        if (this.isInitiator) {
          // Create and send offer signal
          this.rtcService.createOffer(this.userId, this.currentRoom.roomId);
        }
        break;
      case OFFER:
        console.log("Received an OFFER signal");

        let rtcSessionDescInit = Utils.sdpTransform(signal.message);
        this.rtcService.addRemoteDescription(new RTCSessionDescription(rtcSessionDescInit));
        
        this.rtcService.createAnswer(this.userId, this.currentRoom.roomId);
        break;
      case ANSWER:
        let remoteDesc = Utils.sdpTransform(signal.message);
        this.rtcService.addRemoteDescription(remoteDesc);
        break;
      case ICE_CANDIDATE:
        if (signal.message == 'null')
          return;

        let iceCandidate = Utils.iceCandidateTransform(signal.message);
        this.rtcService.addIceCandidate(new RTCIceCandidate(iceCandidate));
        break;
      case CLOSED:
        console.log("Received a CLOSED signal");
        this.statusService.setStatus(CLOSED);
      default:
        break;
    }
  }

  /**
   * Create an empty room or join an existing room
   * 
   */
  private createOrJoinRoom() {
    // if no 2nd user exists in the room, this user is the initiator
    this.isInitiator = this.currentRoom.userTwoId === "";

    if (this.isInitiator) {
      console.log("Sending CREATE_ROOM signal");

      this.userId = this.currentRoom.userOneId;
      const signal = Utils.createSignal(this.currentRoom.userOneId, '', this.currentRoom.roomId, CREATE_ROOM);
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);
    } else {
      console.log("Sending JOIN_ROOM signal");

      this.userId = this.currentRoom.userTwoId;
      const signal = Utils.createSignal(this.currentRoom.userTwoId, '', this.currentRoom.roomId, JOIN_ROOM);
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);

      // update the room data in the database
      this.currentRoom.joinTime = new Date().toString();

      this.roomService.updateRoom(this.currentRoom).subscribe((room) => {
        this.currentRoom = room;
      });
    }
  }

  /**
   * Create and send an End Chat signal
   * 
   */
  public sendEndChatSignal() {
    try {
      // create and send an end chat signal
      const sig = Utils.createSignal(this.userId, '', this.currentRoom.roomId, CLOSED);
      this.signalingService.sendSignal(this.currentRoom.roomId, sig);

      // update the room data in the database
      this.currentRoom.endTime = new Date().toString();
      this.roomService.updateRoom(this.currentRoom).subscribe((room) => {
        console.log('Room updated with end time: ');
      });

      this.statusService.setStatus(CLOSED);
    } catch (err) {
      console.error("Error sending end chat signal: " + err.message);
    }
  }

  /**
   * Start listening for signals from the current room
   * 
   */
  private startListener() {   
    // start the Firestore listener to listen for incoming signals
    this.signalingService.startSignalListener(this.currentRoom.roomId);

    console.log('Starting Signal Listener for room: ' + this.currentRoom.roomId);
    
    // listen for the incoming signals
    this.signalingService.getSignalListener().subscribe(
      (resp) => {
        resp.map(changes => {
          const signal = changes.payload.doc.data() as Signal;

          // validate the latest incoming signal is not the same as the last
          if (Utils.compareSignals(signal, this.signalCache)) {
            return;
          }

          // validate the room ids match
          if (signal.roomId !== this.currentRoom.roomId) {
            return;
          }

          // add the signal to the cache
          this.signalCache.push(signal);

          // resolve the signal
          this.handleSignal(signal);
        })
      },
      (error) => {
        console.error("Error receiving signal: " + error.message);
      }
    )
  }
}
