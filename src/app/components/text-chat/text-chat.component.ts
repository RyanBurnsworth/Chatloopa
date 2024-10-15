import { Component, OnInit } from '@angular/core';
import { Room } from 'src/app/models/room.model';
import { Signal } from 'src/app/models/signal.model';
import { RoomService } from 'src/app/services/room.service';
import { SignalingService } from 'src/app/services/signaling.service';
import { JOIN_CHAT, END_CHAT } from 'src/app/shared/constants';
import { Utils } from 'src/app/shared/utils';

@Component({
  selector: 'app-text-chat',
  templateUrl: './text-chat.component.html',
  styleUrl: './text-chat.component.scss'
})
export class TextChatComponent implements OnInit {
  roomId: string;
  localUser: string;
  remoteUser: string;

  private currentRoom: Room;
  private isConnected = false;

  constructor(private readonly signalingService: SignalingService,
    private readonly roomService: RoomService,
  ) { }

  ngOnInit(): void {
    this.roomService.getSoloRoom().subscribe(room => {
      this.currentRoom = room;
      this.createOrJoinRoom();
    });
  }

  /**
   * Create an empty room or join an existing room
   * 
   */
  private createOrJoinRoom() {
    if (this.currentRoom.userTwoId === '') {
      console.log("Creating a text chat room");

      // only the room creator needs to listen for the JOIN_CHAT signal
      this.startSignalListener();
    } else {
      console.log("Joining a text chat room");
      this.localUser = this.currentRoom.userTwoId;
      this.remoteUser = this.currentRoom.userOneId;
      this.roomId = this.currentRoom.roomId;

      // send a JOIN_CHAT signal to the room creator
      const signal = Utils.createSignal(this.localUser, '', this.roomId, JOIN_CHAT);
      this.signalingService.sendSignal(this.currentRoom.roomId, signal);

      this.isConnected = true;
    }
  }

  private startSignalListener() {
    this.signalingService.startSignalListener(this.currentRoom.roomId);

    this.signalingService.getSignalListener().subscribe((resp) => {
      resp.map(changes => {
        const signal = changes.payload.doc.data() as Signal;

        if (signal.userId === this.localUser) {
          return;
        }

        switch (signal.type) {
          case JOIN_CHAT:
            if (this.isConnected) {
              return;
            }

            console.log('Received JOIN_CHAT signal');
            this.roomId = this.currentRoom.roomId;
            this.localUser = this.currentRoom.userOneId;
            this.remoteUser = signal.userId;
            this.isConnected = true;
            break;
          case END_CHAT:
            if (!this.isConnected) {
              return;
            }

            console.log("Chat has been ended");
            this.roomId = '';
            this.remoteUser = '';
            this.localUser = '';
            this.currentRoom = undefined;
            this.isConnected = false;
          default:
            console.log('Received unknown signal type: ' + signal.type);
            break;
        }
      });
    });
  }
}
