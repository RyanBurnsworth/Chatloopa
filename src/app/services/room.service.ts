import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})

export class RtcService {
  constructor(private readonly httpClient: HttpClient) {
   }
  currentRoom$ = new ReplaySubject<Room>(1);

  /**
   * Fetch a room without userTwoId set
   * 
   * @returns Observable of {@link Room}
   */
  public getSoloRoom(): Observable<Room> {
    console.log("Fetching room from rtc service from local api");
    return this.httpClient.get('https://developingads.com:3000/room', { responseType: 'json' } ) as Observable<Room>
  }

  public updateRoom(room: Room): Observable<Room> {
    console.log("Updating room");
    return this.httpClient.put('https://developingads.com:3000/room/' + room._id, room, { responseType: 'json' }) as Observable<Room>
  }
}
