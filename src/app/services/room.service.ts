import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})

export class RoomService {
  constructor(private readonly httpClient: HttpClient) {
   }
  currentRoom$ = new ReplaySubject<Room>(1);

  /**
   * Fetch a room without userTwoId set
   * 
   * @returns Observable of {@link Room}
   */
  public getSoloRoom(): Observable<Room> {
    console.log("Fetching an empty room");
    return this.httpClient.get('https://developingads.com:3000/room', { responseType: 'json' } ) as Observable<Room>
  }

  /**
   * Update an existing room
   * @param room the room to update
   * @returns 
   */
  public updateRoom(room: Room): Observable<Room> {
    console.log("Updating room :", room.roomId);
    return this.httpClient.put('https://developingads.com:3000/room/' + room._id, room, { responseType: 'json' }) as Observable<Room>
  }
}
