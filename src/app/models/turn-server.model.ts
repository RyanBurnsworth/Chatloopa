import { IceServer } from "./ice-server.model";

export class TurnServer {
    s: string;
    p: string;
    e: any;
    iceCandidateList: IceServer[];
}
