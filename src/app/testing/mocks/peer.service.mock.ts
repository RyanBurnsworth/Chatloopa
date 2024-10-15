export class PeerServiceMock {

    connect(): void {
        console.log('Mock connect called');
    }

    disconnect(): void {
        console.log('Mock disconnect called');
    }

    sendData(data: any): void {
        console.log('Mock sendData called with data:', data);
    }

    receiveData(): any {
        console.log('Mock receiveData called');
        return 'Mock data';
    }
}