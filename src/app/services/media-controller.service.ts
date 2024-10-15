import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { StatusService } from './status.service';
import { PERMISSION_ERROR, SEARCHING } from '../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class MediaControllerService {
  // an observable used to update the local stream on the UI
  private localStreamSubject = new Subject<MediaStream>();
  localStream$ = this.localStreamSubject.asObservable();

  // an observable used to update the remote stream on the UI
  private remoteStreamSubject = new Subject<MediaStream>();
  remoteStream$ = this.remoteStreamSubject.asObservable();
  
  constructor(private readonly statusService: StatusService) { }

  /**
   * Enable the camera and microphone
   * 
   * @returns a MediaStream object
   **/
  public getLocalMediaStream(): MediaStream | undefined {
    window.navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    .then((stream) => {
      console.log("Obtained camera and microphone");
      this.setLocalStream(stream);

      // set the status to searching to kick off the signaling process
      this.statusService.setStatus(SEARCHING);
    }).catch(err => {
      // this.openErrorSnackBar("Error: Couldn't obtain camera and/or microphone!");
      console.error("Error obtaining camera and microphone: " + err.message);
      this.statusService.setStatus(PERMISSION_ERROR);
      // this.stopService();
    });
    return undefined;
  }

  /**
   * Returns the remote stream as an observable to be listened to for changes
   * 
   * @returns an observable of the remote stream
   */
  public getRemoteStream(): Observable<MediaStream> {
    return this.remoteStream$;
  }

  /**
   * Sets the current remote stream object
   * 
   * @param stream The MediaStream object to set as the remote stream
   */
  public setRemoteStream(stream: MediaStream) {
    this.remoteStreamSubject.next(stream);
  }

  /**
   * Returns the local stream as an observable to be listened to for changes
   * 
   * @returns an observable of the local stream
   */
  public getLocalStream(): Observable<MediaStream> {
    return this.localStream$;
  }

  /**
   * Sets the current local stream object
   * 
   * @param stream The MediaStream object to set as the local stream
   */
  public setLocalStream(stream: MediaStream) {
    this.localStreamSubject.next(stream);
  }
}
