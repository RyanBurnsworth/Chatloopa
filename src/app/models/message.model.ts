export class Message {
    id: string;
    
    // first userId in the array is the sender
    participants: string[];

    messageId: string;

    content: string;

    timestamp: number;

    deliveryTime: string;

    status: 'sent' | 'delivered' | 'read';

    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'emoji';
}
