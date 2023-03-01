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
    console.log("Fetching room from rtc service");
    return this.httpClient.get('https://chatloopa:3000/room', {responseType: 'json'} ) as Observable<Room>
  }
}
