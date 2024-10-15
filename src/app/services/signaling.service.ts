import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Signal } from '../models/signal.model';
import { DocumentChangeAction, AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class SignalingService {
  private signalListener: Observable<DocumentChangeAction<unknown>[]>;

  constructor(private firestore: AngularFirestore) { }

  startSignalListener(roomId: string) {
    this.signalListener = this.firestore.collection(roomId).snapshotChanges() as unknown as Observable<DocumentChangeAction<Signal>[]>;
  }

  getSignalListener() {
    return this.signalListener;
  }

  sendSignal(collectionName: string, signal: Signal) {
    this.firestore.collection(collectionName).add(Object.assign({}, signal)).then(() => {
      console.log('Signal sent');
    }).catch((error) => {
      console.error('Error sending signal: ', error);
    });
  }

  updateRoom(collectionName: string, signal: Signal) {
    this.firestore.doc(collectionName + '/' + signal.userId).update(signal).then(() => {
      console.log('Room updated');
    }).catch((error) => {
      console.error('Error updating room: ', error);
    });
  }

  deleteRoom(collectionName: string, signal: Signal) {
    this.firestore.doc(collectionName + '/' + signal.userId).delete().then(() => {
      console.log('Room deleted');
    }).catch((error) => {
      console.error('Error deleting room: ', error);
    });
  }
}
