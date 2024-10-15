import { emojiMap } from "../models/emoji.map";
import { Message } from "../models/message.model";
import { Signal } from "../models/signal.model";
import * as uuid from 'uuid';

export class Utils {
  public static sdpTransform(sdpValue: string): RTCSessionDescriptionInit {
    let descInitObj = JSON.parse(sdpValue);
    let descInit: RTCSessionDescriptionInit = {
      sdp: descInitObj.sdp,
      type: descInitObj.type,
    }
    return descInit
  }

  public static iceCandidateTransform(iceCandidate: string): RTCIceCandidateInit {
    let iceCandidateObj = JSON.parse(iceCandidate);
    let iceCandidateInit: RTCIceCandidateInit = {
      candidate: iceCandidateObj.candidate,
      sdpMLineIndex: iceCandidateObj.sdpMLineIndex,
      sdpMid: iceCandidateObj.sdpMid,
    }
    return iceCandidateInit;
  }

  public static compareSignals(signalObj: Signal, signalList: Signal[]) {
    let contains = false;

    signalList.forEach((sig => {
      if (sig.id == signalObj.id) {
        contains = true;
      }
    }));
    return contains;
  }

  public static createSignal(userId: string, message: string, roomId: string, signalType: string): Signal {
    let signal = new Signal();
    signal.id = uuid.v4();
    signal.message = message;
    signal.userId = userId;
    signal.type = signalType;
    signal.timestamp = new Date();
    signal.roomId = roomId;

    return signal;
  }

  public static createMessage(senderId: string, recipientId: string, message: string, type: any = 'text'): Message {
    let msg = new Message();
    msg.id = uuid.v4();
    msg.participants = [senderId, recipientId];
    msg.content = message;
    msg.timestamp = Date.now();
    msg.type = type;

    return msg;
  }

  // Convert a timestamp to a human-readable format
  public static timeAgoOrDate(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    // If within 24 hours, show the exact time of day (hh:mm a)
    if (diff < 24 * 60 * 60 * 1000) {
      return this.formatTimeOfDay(timestamp);
    } else {
      // Otherwise, show the exact time of day (hh:mm a)
      return this.formatTimeOfDay(timestamp);
    }
  }

  // Function to return time of day (hh:mm a) format
  private static formatTimeOfDay(timestamp: number): string {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12;
    if (hours === 0) { hours = 12; }

    // Pad minutes to ensure it's always 2 digits
    const minutesStr = minutes.toString().padStart(2, '0');

    // Return formatted time (hh:mm a)
    return `${hours}:${minutesStr} ${ampm}`;
  }
  
  public static convertToEmoji(message: string): string {
    const messageArray = message.split(' ');
    let newMessage = '';
    messageArray.forEach(word => {
      newMessage += emojiMap[word] || word;
      newMessage += ' ';
    });
    return newMessage;
  }
}
