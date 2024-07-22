import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Message } from 'src/app/models/message.model';
import { Room } from 'src/app/models/room.model';
import { Status } from 'src/app/models/status.model';
import { MessageService } from 'src/app/services/message.service';
import { RtcService } from 'src/app/services/room.service';
import { StatusService } from 'src/app/services/status.service';
import { Utils } from 'src/app/shared/utils';

@Component({
  selector: 'app-text-chat',
  templateUrl: './text-chat.component.html',
  styleUrls: ['./text-chat.component.scss']
})
export class TextChatComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild("chatContainer") private chatContainer: ElementRef;
  @ViewChild("messageBox") private messageBox: ElementRef;

  messageUpdateListener$: any;

  statusUpdateListener$: any;

  // message storage
  messages: Message[] = [];

  // current userId
  userId: string = "";

  // current peer id
  peerId: string = "";

  // the peer userId
  recipientId: string = "";

  // current roomId
  roomId: string = "";

  isConnected = false;

  isPeerConnected = false;

  isServiceStarted = false;

  constructor(private readonly messageService: MessageService, 
    private readonly roomService: RtcService, 
    private readonly statusService: StatusService,
    private snackBar: MatSnackBar) { }
 
  ngOnInit(): void {
    window.addEventListener('popstate', this.onPopState);
  }

  ngAfterViewInit() {
    // setup the text chat room
    this.startService();
  }

  ngAfterViewChecked() {
    // after every UI update scroll to bottom
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.onPopState);
    this.destroyMessageUpdateListener();
    this.destroyStatusUpdateListener();
  }

  /**
   * Send a message to the other user via Firestore
   * 
   * @param value the message to be sent
   */
  sendMessage(value: string) {
    if (value === '' || !this.isPeerConnected) {
      return;
    }

    const message = this.messageService.buildMessage(this.roomId, this.userId, this.recipientId, "MESSAGE", value)
    this.messageService.sendChatMessage(this.roomId, message).then(() => {
      // clear the message box after message sent successfully
      this.messageBox.nativeElement.value = "";
    }).catch((error) => {
      console.error("Error sending message: ", error);
      this.openErrorSnackbar('Error sending message. Please try again');
    });
  }

  /**
   * Start the text chat service
   */
  startService(): void {
    console.log('Starting text chat service');

    // start with a fresh service
    if (this.isConnected) {
      this.disconnectService();
    }

    // set the focus on the messagebox after UI loads
    this.messageBox.nativeElement.focus();

    // clear the message queue
    this.messages = [];

    // create or join a text chat room
    this.fetchTextChatRoom();
  }

  /**
   * Stop the text chat service
   */
  stopService(): void {
    console.log("Stopping text chat");
    this.disconnectService();
    
    this.messages = [];
    
    this.destroyMessageUpdateListener();
    this.destroyStatusUpdateListener();
  }

  private disconnectService(): void {
    if (this.isConnected) {
      this.sendStatusUpdate('DISCONNECTED');
    }

    this.messages = [];
    this.userId = '';
    this.roomId = '';
    this.peerId = '';
    
    this.isConnected = false;
    this.isPeerConnected = false;
  }

  /**
   * Send a status update event
   * 
   * @param statusUpdate status update 'CONNECTED', 'DISCONNECTED'
   */
  private sendStatusUpdate(statusUpdate: string) {
    const status = this.statusService.buildStatus(this.roomId, statusUpdate, this.userId, '');
    this.statusUpdateListener$ = this.statusService.sendStatusUpdate(status).then(() => {
    }).catch((error) => {
      console.error("Error sending status update: ", error);
      this.openErrorSnackbar('Error connecting to service')
    })
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

      this.initRoomStatusListener();

      if (room.userTwoId !== '') {
        // if the storedUserId matches userOneId then you are in a room with yourself
        if (storedUserId === room.userOneId) {
          this.fetchTextChatRoom();
          return;
        }

        // we are successfully in a peer-to-peer chat
        this.isConnected = true;
        this.isPeerConnected = true;
        this.userId = room.userTwoId;
        
        // initialize the message listener on this chat room
        this.initMessageListener();

        // send status update of CONNECTED
        this.sendStatusUpdate('CONNECTED');
      } else {
        // we are waiting for another peer to connect
        this.isConnected = false;
        this.isPeerConnected = false;
        this.userId = room.userOneId;
        localStorage.setItem('userId', this.userId);

        // stop listening for messages from this chat room
        this.destroyMessageUpdateListener();
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
        this.openErrorSnackbar('Error receiving messages');
      }
    });
  }

  /**
   * Start listening to the status of the room. This tells whether someone joined or left the room
   */
  private initRoomStatusListener(): void {
    this.statusService.getStatusUpdates(this.roomId).subscribe((statusUpdate) => {
      statusUpdate.map(updates => {
        const status = updates.payload.doc.data() as Status;
        if (status.reporterId !== this.userId) {
          if (status.status === 'CONNECTED' && !this.isConnected) {
            this.isConnected = true;
            this.isPeerConnected = true;
            this.peerId = status.reporterId;
            this.initMessageListener();
          } else if (status.status === 'DISCONNECTED' && this.isConnected && status.reporterId === this.peerId) {         
            this.openSnackbar('Peer Disconnected', 2500);  
            console.log("Disconnecting");
            this.isConnected = false;
            this.isPeerConnected = false;
            this.messages = [];
          }
        }
      });
    });
  }

  /**
   * Show a regular snackbar for errors
   * @param message the message to be displayed
   * @param duration the duration of the snackbar
   */
  private openSnackbar(message: string, duration?: number) {
    this.snackBar.open(message, "", { duration: duration || 5000});
  }

  /**
   * Show a red snackbar for errors
   * @param message the message to be displayed
   * @param duration the duration of the snackbar
   */
  private openErrorSnackbar(message: string, duration?: number) {
    this.snackBar.open(message, "", { duration: duration || 5000, panelClass: ['red-snackbar'] });
  }

  /**
   * Unsubscribe from the message update listener
   */
  private destroyMessageUpdateListener() {
    if (this.messageUpdateListener$) {
      this.messageUpdateListener$.unsubscribe();
      this.messageUpdateListener$ = null;
    }
  }

  /**
   * Unsubscribe from the status update listener
   */
  private destroyStatusUpdateListener() {
    if (this.statusUpdateListener$) {
      this.statusUpdateListener$.unsubscribe();
      this.statusUpdateListener$ = null;
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    this.sendStatusUpdate('DISCONNECTED')
  }

  onPopState(event: PopStateEvent) {
    console.log('Back button or history navigation detected');
    this.sendStatusUpdate('DISCONNECTED');
  }
}
