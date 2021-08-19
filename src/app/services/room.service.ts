import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})

export class RoomService {
  constructor(private readonly httpClient: HttpClient) {
   }

   public getRoom(): Observable<Room> {
     return this.httpClient.get('http://localhost:8080/vacancy', {responseType: 'json'} ) as Observable<Room>
   }
}
