import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Room } from '../models/room.model';
import { MessageService } from '../services/message.service';
import { RoomService } from '../services/room.service';

@Component({
  selector: 'app-web-chat',
  templateUrl: './web-chat.component.html',
  styleUrls: ['./web-chat.component.scss']
})
export class WebChatComponent implements OnInit {
  currentRoom: Room;

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
