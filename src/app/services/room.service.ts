import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})

export class RoomService {
  constructor(private readonly httpClient: HttpClient) {
   }
  currentRoom$ = new Subject<Room>();

  public getRoom(): Observable<Room> {
    return this.httpClient.get('https://burnsworthrobotics.com:8443/vacancy', {responseType: 'json'} ) as Observable<Room>
  }
}
