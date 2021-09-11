import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Signal } from '../models/signal.model';

@Injectable({
  providedIn: 'root'
})
export class SignalingService {
  private signalListener: Observable<DocumentChangeAction<unknown>[]>;

  constructor(private firestore: AngularFirestore) { }

  startSignalListener(roomId: string) {
    this.signalListener = this.firestore.collection(roomId).snapshotChanges();
  }

  getSignalListener() {
   return this.signalListener;
  }

  sendSignal(collectionName: string, signal: Signal) {
    this.firestore.collection(collectionName).add(Object.assign({}, signal));
  }

  updateRoom(collectionName: string, signal: Signal) {
    this.firestore.doc(collectionName + '/' + signal.userId).update(signal);
  }

  deleteRoom(collectionName: string, signal: Signal) {
    this.firestore.doc(collectionName + '/' + signal.userId).delete();
  }
}
