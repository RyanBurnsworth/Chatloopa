import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Signal } from '../models/signal.model';

@Injectable({
  providedIn: 'root'
})
export class SignalingService {

  constructor(private firestore: AngularFirestore) { }

  getSignalListener(roomId: string) {
    return this.firestore.collection(roomId).snapshotChanges();
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
