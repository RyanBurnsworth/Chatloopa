import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class UserCountService {
  constructor(private readonly httpClient: HttpClient) { }

  currentUserCount$ = new ReplaySubject<UserCount>(1);

  /**
   * Fetch the current user count
   * 
   * @returns Observable of {@link UserCount}
   */
  public getCurrentUserCount(): Observable<UserCount> {
    console.log("Fetching user count from rtc service from local api");
    return this.httpClient.get('https://developingads.com:3000/user-count', { responseType: 'json' }) as Observable<UserCount>
  }

  public addToUserCount(): Observable<UserCount> {
    console.log("Updating user count +1");
    return this.httpClient.post('https://developingads.com:3000/user-count', { responseType: 'json' }) as Observable<UserCount>;
  }

  public removeFromUserCount(): Observable<UserCount> {
    console.log("Updating user count -1");
    return this.httpClient.delete('https://developingads.com:3000/user-count', { responseType: 'json' }) as Observable<UserCount>;
  }
}

export interface UserCount {
  currentCount: number;
}