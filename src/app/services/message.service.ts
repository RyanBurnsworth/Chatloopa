import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messageListener: Observable<DocumentChangeAction<unknown>[]>;
  
  constructor(private readonly firestore: AngularFirestore) { }

  startMessageListener(chatId: string) {
    this.messageListener = this.firestore.collection(chatId).snapshotChanges() as unknown as Observable<DocumentChangeAction<Message>[]>;
  }
  
  getMessageListener() {
    return this.messageListener;
  }

  sendMessage(chatId: string, message: Message) {
    this.firestore.collection(chatId).add(Object.assign({}, message)).then(() => {
      console.log('Message sent');
    }).catch((error) => {
      console.error('Error sending message: ', error);
    });
  }
}
