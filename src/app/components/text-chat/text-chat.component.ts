import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Message } from 'src/app/models/message.model';
import { Room } from 'src/app/models/room.model';
import { MessageService } from 'src/app/services/message.service';
import { RtcService } from 'src/app/services/room.service';
import { Utils } from 'src/app/shared/utils';

@Component({
  selector: 'app-text-chat',
  templateUrl: './text-chat.component.html',
  styleUrls: ['./text-chat.component.scss']
})
export class TextChatComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild("chatContainer") private chatContainer: ElementRef;
  @ViewChild("messageBox") private messageBox: ElementRef;

  messageUpdateListener$: any;

  // message storage
  messages: Message[] = [];

  // current userId
  userId: string = "";

  // the peer userId
  recipientId: string = "";

  // current roomId
  roomId: string = "";

  isConnected = false;

  constructor(private readonly messageService: MessageService, private readonly roomService: RtcService) { }

  ngOnInit(): void {
    // setup the text chat room
    this.fetchTextChatRoom();

    console.log("RoomID: ", this.roomId);
  }

  ngAfterViewInit() {
    // set the focus on the messagebox after UI loads
    this.messageBox.nativeElement.focus();
  }

  ngAfterViewChecked() {
    // after every UI update scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Send a message to the other user via Firestore
   * 
   * @param value the message to be sent
   */
  sendMessage(value: string) {
    if (value === '') {
      return;
    }

    const message = this.messageService.buildMessage(this.roomId, this.userId, this.recipientId, "MESSAGE", value)
    this.messageService.sendChatMessage(this.roomId, message).then(() => {
      // clear the message box after message sent successfully
      this.messageBox.nativeElement.value = "";
    }).catch((error) => {
      console.error("Error sending message: ", error);
    });
  }

  /**
   * Scrolls the chatbox to the bottom
   */
  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Get a text chat room from the service
   */
  private fetchTextChatRoom(): void {
    const storedUserId = localStorage.getItem('userId');

    // generate a new room
    this.roomService.getSoloRoom().subscribe((room) => {
      room = room as Room;

      this.roomId = room.roomId;

      if (room.userTwoId !== '') {
        // if the storedUserId matches userOneId then you are in a room with yourself
        if (storedUserId === room.userOneId) {
          console.log("Fetching a new room");
          this.fetchTextChatRoom();
          return;
        }

        // we are successfully in a peer-to-peer chat
        this.isConnected = true;
        this.userId = room.userTwoId;
        
        // initialize the message listener on this chat room
        this.initMessageListener();

      } else {
        // we are waiting for another peer to connect
        this.isConnected = false;
        this.userId = room.userOneId;
        localStorage.setItem('userId', this.userId);

        // stop listening for messages from this chat room
        if (this.messageUpdateListener$) {
          this.messageUpdateListener$.unsubscribe();
          this.messageUpdateListener$ = null;
        }
      }
    });
  }

  /**
   * Start the Firestore listener for incoming and outgoing messages
   */
  private initMessageListener(): void {
    // listen for incoming / outgoing messages and update the chatbox
    this.messageUpdateListener$ = this.messageService.getChatUpdates(this.roomId).subscribe((resp) => {
      resp.map(changes => {
        // extract the message data
        const message = changes.payload.doc.data() as Message;
        if (Utils.compareMessages(message, this.messages) === false) {
          this.messages.push(message);
        }
      }),
      (error) => {
        console.error("Error receiving message: " + error);
      }
    });
  }
}
