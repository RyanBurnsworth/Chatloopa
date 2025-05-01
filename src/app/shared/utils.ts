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
}
