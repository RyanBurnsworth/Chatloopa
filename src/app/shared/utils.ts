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
            if (sig.userId == signalObj.userId &&
                sig.message == signalObj.message &&
                sig.type == signalObj.type &&
                signalObj.type != 'ICE_CANDIDATE') {
                contains = true;
            } 
        }));
        return contains;
    }
}
