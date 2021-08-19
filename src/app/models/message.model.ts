export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    type: string;
    message: string;
    created_on: string;
    read_on: string;
}
