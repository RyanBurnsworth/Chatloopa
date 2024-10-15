import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MessageService } from 'src/app/services/message.service';
import { Message } from 'src/app/models/message.model';
import { Utils } from 'src/app/shared/utils';
import { ServiceStatusService } from 'src/app/services/service-status.service';
import { DEFAULT_CHAT_MESSAGE, EMOJI, SEND_EMOJI, STARTED, STOPPED } from 'src/app/shared/constants';
import { InteractionService } from 'src/app/services/interaction.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit, AfterViewChecked, OnChanges {
  messageCount: number = 0;
  messageList: Message[] = [];
  messages$: Observable<Message[]>;
  newMessage: string = '';
  timestamp: number = 0;

  seenMessageList: Set<string> = new Set();

  @ViewChild('messagesContainer', { static: false }) private messagesContainer!: ElementRef;

  @Input() roomId: string;
  @Input() localUser: string;
  @Input() remoteUser: string;

  constructor(private readonly messageService: MessageService,
    private readonly serviceStatusService: ServiceStatusService,
    private readonly interactionService: InteractionService,
  ) { }

  ngOnInit() {
    // loads a default message when the component is initialized
    this.loadInitialMessage();

    this.interactionService.getInteraction().subscribe((interaction) => {
      if (interaction === SEND_EMOJI) {
        this.sendEmojiEventMessage();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.roomId && changes.roomId.currentValue && changes.roomId.currentValue !== '' && changes.localUser &&
       changes.localUser.currentValue && changes.localUser.currentValue !== '' && changes.remoteUser && changes.remoteUser.currentValue && changes.remoteUser.currentValue !== '') {
      this.initializeListeners();
    }
  }

  ngAfterViewChecked() {
    if (this.messageCount !== this.messageList.length) {
      this.messageCount = this.messageList.length;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;

      container.scrollTop = container.scrollHeight;
    }
  }

  sendMessage() {
    if (this.newMessage.length === 0 || this.roomId === '' || this.localUser === '' || this.remoteUser === '') {
      return;
    }

    // when the send message button is used, the localUser is the sender. 
    // Thus, the first parameter in message.participants is the sender
    const message = Utils.createMessage(this.localUser, this.remoteUser, this.newMessage);

    this.messageService.sendMessage(this.roomId, message);

    this.newMessage = '';
  }

  private initializeListeners() {
    this.initializeMessageListener();
    this.initializeServiceStatusListener();
  }

  private initializeMessageListener() {
    console.log('Initializing message listener');

    this.messageService.startMessageListener(this.roomId);

    this.messageService.getMessageListener().subscribe((message) => {
      let messageData = message.map((newMessage) => newMessage.payload.doc.data() as Message);
      messageData = messageData.sort((a, b) => a.timestamp - b.timestamp);

      messageData.forEach((msg => {
        // if this message has not been seen before, add it to the list
        if (!this.seenMessageList.has(msg.id) && msg.type === 'text' && msg.participants && msg.participants.length === 2 && msg.content && msg.content !== '') {
          this.seenMessageList.add(msg.id);
          
          msg.deliveryTime = Utils.timeAgoOrDate(msg.timestamp);
          
          // convert any emoji characters in the message to emoji images
          msg.content = Utils.convertToEmoji(msg.content);

          this.messageList.push(msg);
        } else if (!this.seenMessageList.has(msg.id) && msg.participants && msg.participants.length === 2 && msg.type === 'emoji') {
          this.seenMessageList.add(msg.id);
          // emit EMOJI event to video-text component to display the emoji
          this.interactionService.emitInteraction(EMOJI);
        }
      }));

      if (this.messageList.length === 0) {
        return;
      }

      this.messages$ = of(this.messageList);
    });
  }
  
  private initializeServiceStatusListener() {
    // listen for changes in the status of the service
    this.serviceStatusService.getServiceStatusListener().subscribe((status) => {
      if (status === STARTED) {
        this.messageList = [];
        this.messages$ = of(this.messageList);
        this.newMessage = '';

        // loads a default message when the component is initialized
        this.loadInitialMessage();
      } else if (status === STOPPED) {
        console.log('Service stopped');
      }
    });
  }

  private loadInitialMessage() {
    const msg = new Message();
    msg.id = '1';
    msg.content = DEFAULT_CHAT_MESSAGE;
    msg.timestamp = Date.now();
    msg.participants = ['ChatLoopa', this.remoteUser];
    msg.deliveryTime = '';
    msg.type = 'text';

    this.seenMessageList.add(msg.id);
    this.messageList.push(msg);
    this.messages$ = of(this.messageList);
  }

  private sendEmojiEventMessage() {
    const message = Utils.createMessage(this.localUser, this.remoteUser, 'Emoji event', 'emoji');
    this.messageService.sendMessage(this.roomId, message);
  }
}
