import { Message } from "../models/message.model";
import { Signal } from "../models/signal.model";

export class Utils {
    public static sdpTransform(sdpValue: string) : RTCSessionDescriptionInit {
        let descInitObj = JSON.parse(sdpValue);
        let descInit: RTCSessionDescriptionInit = {
            sdp: descInitObj.sdp,
            type: descInitObj.type,
        }
        return descInit
    }

    public static iceCandidateTransform(iceCandidate: string) : RTCIceCandidateInit {
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

    public static compareMessages(messageObj: Message, messageList: Message[]) {
        let contains = false;

        messageList.forEach((msg => {
            if (msg.id == messageObj.id &&
                msg.senderId == messageObj.senderId &&
                msg.recipientId == messageObj.recipientId &&
                msg.message == messageObj.message &&
                msg.created_on == messageObj.created_on &&
                msg.read_on == messageObj.read_on ||
                messageObj.type != 'MESSAGE') {
                contains = true;
            } 
        }));
        return contains;
    }
}
