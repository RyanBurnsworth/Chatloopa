import { Injectable } from '@angular/core';
import { SignalingService } from './signaling.service';
import { ANSWER, CLOSED, CONNECTED, CONNECTING, DISCONNECTED, FAILED, ICE_CANDIDATE, OFFER } from '../shared/constants';
import { ICE_SERVERS } from '../config/ice-servers.config';
import { Utils } from '../shared/utils';
import { MediaControllerService } from './media-controller.service';
import { StatusService } from './status.service';

@Injectable({
  providedIn: 'root'
})
export class RtcService {
  private peerConnection: RTCPeerConnection;

  constructor(private readonly signalingService: SignalingService,
    private readonly mediaControllerService: MediaControllerService,
    private readonly statusService: StatusService,
  ) { }

  /**
   * Initialize the WebRTC connection
   * 
   * @param userId the id of the user
   * @param roomId the id of the room
   */
  public initializeWebRTC() {
    try {
      this.peerConnection = this.createPeerConnection();
    } catch (error) {
      console.error(error);

      // retry upon failure
      this.peerConnection = this.createPeerConnection();
    }
  }

  /**
   * Setup the peer connection event listeners
   * 
   * @param userId the id of the user
   * @param roomId the id of the room
   */
  public setupRTCConnectionEventListeners(userId: string, roomId: string) {
    // Triggers an event when a new ICE candidate has been found
    this.peerConnection.onicecandidate = event => {
      const sig = Utils.createSignal(userId, JSON.stringify(event.candidate), roomId, ICE_CANDIDATE);
      this.signalingService.sendSignal(roomId, sig);
    };

    // Triggers an event when the ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const connectionState = this.peerConnection.iceConnectionState;

      if (connectionState === 'closed') {
        console.log('Peer connection closed.');
      }

      if (connectionState === 'disconnected' || connectionState === 'failed') {
        console.log("A peer has left or the connection failed.");
      }
    };

    // Triggers an event when a new stream has been added or when when a track has been removed
    this.peerConnection.ontrack = event => {
      if (event.track.kind === 'video') {
        // Add the stream to the peer connection
        this.addStream(event.streams[0]);

        // Set the remote stream on the UI
        this.mediaControllerService.setRemoteStream(event.streams[0]);
      }
    };

    // Triggers an event when the connection state changes
    this.peerConnection.onconnectionstatechange = event => {
      console.log("Received connection state change event. Connection state change: " + (event.currentTarget as RTCPeerConnection).connectionState);

      switch ((event.currentTarget as RTCPeerConnection).connectionState) {
        case "connected":
          this.statusService.setStatus(CONNECTED);
          break;
        case "connecting":
          this.statusService.setStatus(CONNECTING);
          break;
        case "disconnected":
          this.statusService.setStatus(DISCONNECTED);
          break;
        case "failed":
          this.statusService.setStatus(FAILED);
          break;
        case "closed":
          this.statusService.setStatus(CLOSED);
          break;
        default:
          break;
      }
    }

    // Triggers an event when an ICE candidate error occurs
    this.peerConnection.onicecandidateerror = event => {
      const iceErrorEvent = event as RTCPeerConnectionIceErrorEvent;
      console.error("Received IceCandidateError event. Ice candidate error code: " + iceErrorEvent.errorCode);
    }
  }

  /**
   * Create an offer
   * 
   * @param userId the id of the user creating the offer
   * @param roomId the id of the room
   */
  public createOffer(userId: string, roomId: string) {
    this.peerConnection.createOffer().then(
      (offer) => {
        this.peerConnection.setLocalDescription(offer).then(
          () => {
            const offerSignal = Utils.createSignal(userId, JSON.stringify(offer), roomId, OFFER);
            this.signalingService.sendSignal(roomId, offerSignal)
          },
          (error: Error) => {
            console.error('Error setting local description: ' + error.message);
            this.closeConnection();
          }
        );
      },
      (error: Error) => {
        console.error("Error creating offer: " + error.message),
          this.closeConnection();
      }
    );
  }

  /**
   * Create an answer to an offer
   * 
   * @param userId the id of the user creating the answer
   * @param roomId the id of the room
   */
  public createAnswer(userId: string, roomId: string) {
    // create the Answer signal and send
    this.peerConnection.createAnswer().then(
      (answer) => {
        this.peerConnection.setLocalDescription(answer).then(
          () => {
            // create an answer signal and send
            const sig = Utils.createSignal(userId, JSON.stringify(answer), roomId, ANSWER);
            this.signalingService.sendSignal(roomId, sig);
          },
          (error: Error) => {
            console.error("Error setting local description: " + error.message);
            this.closeConnection();
          }
        );
      },
      (error: Error) => {
        console.error("Error creating answer: " + error.message);
        this.closeConnection();
      },
    );
  }

  /**
   * Add a stream to the peer connection
   * 
   * @param stream The stream to add to the peer connection
   */
  public addStream(stream: MediaStream) {
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
  }

  /**
   * Add an ICE candidate to the peer connection
   * 
   * @param iceCandidate The ICE candidate to add to the peer connection
   */
  public addIceCandidate(iceCandidate: RTCIceCandidate) {
    this.peerConnection.addIceCandidate(iceCandidate)
      .catch((error) => console.error("Error adding ice candidate: " + error.message));
  }

  /**
   * Add a remote description to the peer connection
   * 
   * @param remoteDesc The remote description to add to the peer connection
   */
  public addRemoteDescription(remoteDesc: RTCSessionDescriptionInit) {
    this.peerConnection.setRemoteDescription(remoteDesc).then(() => {
    },
      (error: Error) => {
        console.error("Error setting remote description: " + error.message);
        this.closeConnection();
      }
    );
  }

  /**
   * Close the peer connection
   */
  public closeConnection() {
    try {
      this.peerConnection.close();
    } catch (error) {
      console.error('Failed to close peer connection', error);
    }
  }

  /**
   * Create a new RTCPeerConnection object
   * 
   * @returns a new RTCPeerConnection object
   */
  private createPeerConnection(): RTCPeerConnection {
    return new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });
  }
}
