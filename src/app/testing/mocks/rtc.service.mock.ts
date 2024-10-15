import * as jest from 'jest-mock';

export class RtcServiceMock {
  public getIceServers = jest.fn();
  public createPeerConnection = jest.fn();
  public createDataChannel = jest.fn();
  public createOffer = jest.fn();
  public createAnswer = jest.fn();
  public setLocalDescription = jest.fn();
  public setRemoteDescription = jest.fn();
  public addIceCandidate = jest.fn();
  public close = jest.fn();
};
