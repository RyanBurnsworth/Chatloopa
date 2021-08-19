import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../models/message.model';
import { Room } from '../models/room.model';
import { MessageService } from '../services/message.service';
import { RoomService } from '../services/room.service';
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-web-chat',
  templateUrl: './web-chat.component.html',
  styleUrls: ['./web-chat.component.scss']
})
export class WebChatComponent implements OnInit {
  currentRoom: Room;
  messageSubject$ = new BehaviorSubject<Message[]>([]);
  messageCache: Message[] = [];
  message: Message;

  @ViewChild('message') messageBox: ElementRef;
  @ViewChild('chatbox', { read: ElementRef }) chatBox: ElementRef;

  constructor(
    private readonly messageService: MessageService,
    private readonly roomService: RoomService,
  ) { }
  
  ngOnInit(): void {
    this.roomService.currentRoom$.subscribe((currentRoom) => {
      this.currentRoom = currentRoom;
      this.initializeChatBox();
    })
  }

  initializeChatBox() {
    this.messageService.getChatUpdates(this.currentRoom.room_id).subscribe(
      (resp) => {
        resp.map((changes) => {
          this.message = changes.payload.doc.data() as Message;
          if (Utils.compareMessages(this.message, this.messageCache)) {
            return;
          }
          this.messageCache.push(this.message);
          this.messageSubject$.next(this.messageCache);
          this.scrollToBottom();
        })
      }
    );
  }
  
  sendMessage() {
    if (this.currentRoom === undefined) {
      this.messageBox.nativeElement.value='';
      console.log("Room id is not set")
      return;
    }

    let msg = this.messageService.buildMessage("1", this.currentRoom.user_id_1, this.currentRoom.user_id_2, "MESSAGE", this.messageBox.nativeElement.value);
    this.messageService.sendChatMessage(this.currentRoom.room_id, msg).then((resp) => {
      this.messageBox.nativeElement.value='';
    }).catch((err) => {
      console.error("Error sending message: " + JSON.stringify(err));
    });
    this.messageBox.nativeElement.value='';
  }

  scrollToBottom() {
    this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
  }
}
