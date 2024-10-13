import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Status } from '../models/status.model';

@Injectable({
  providedIn: 'root'
})
export class StatusService {

  constructor(private firestore: AngularFirestore) { }

  getStatusUpdates(roomId: string) {
    const roomStatusId = roomId + "-status";
    return this.firestore.collection(roomStatusId).snapshotChanges();
  }

  sendStatusUpdate(status: Status) {
    return this.firestore.collection(status.id).add(Object.assign({}, status));
  }

  buildStatus(roomId: string, status: string, reporterId: string, recipientId: string): Status {
    const s: Status = {
      id: roomId + '-status',
      status: status,
      reporterId: reporterId,
      recipientId: recipientId
    };

    return s;
  }
}
