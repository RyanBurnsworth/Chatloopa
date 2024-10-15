import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { TurnServer } from '../models/turn-server.model';

@Injectable({
  providedIn: 'root'
})
export class TurnServerService {
  turnServer: TurnServer;

  constructor(private http: HttpClient) { }

  setTurnServer() {
    const headers = { 'Authorization': 'Basic cnlhbmIxOTg6Y2QxMDM0ZDAtY2NkNy0xMWVhLWE3NGItMDI0MmFjMTUwMDAz' };
    const body = {};
    this.http.put<TurnServer>(environment.turnServiceUrl, body, { headers })
      .subscribe({
        next: resp => {
          this.turnServer = resp as TurnServer;
        },
        error: error => {
          console.error("There was an error: " + error.message);
        }
      });
  }

  public getTurnServer(): TurnServer {
    return this.turnServer;
  }
}
