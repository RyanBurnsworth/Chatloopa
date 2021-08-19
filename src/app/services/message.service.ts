import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private firestore: AngularFirestore) { }

  getChatUpdates(chatId: string) {
    return this.firestore.collection(chatId).snapshotChanges();
  }

  sendChatMessage(chatId: string, message: Message) {
    return this.firestore.collection(chatId).add(Object.assign({}, message));
  }

  buildMessage(id: string, senderId: string, recipientId: string, type: string, message: string) : Message {
    let msg: Message = {
      id: id,
      senderId: senderId,
      recipientId: recipientId,
      type: type,
      message: message,
      created_on: '',
      read_on: '',
    }
    return msg;
  }
}
