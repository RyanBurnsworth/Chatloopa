import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SEARCHING } from '../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private statusSubject = new BehaviorSubject<string>('');
  status$ = this.statusSubject.asObservable();
  
  private currentStatus = SEARCHING;

  constructor() { }

  /**
   * Set the connection status
   * 
   * @param status the status of the connection
   * 
   */
  public setStatus(status: string) {
    if (this.currentStatus === status) {
      return;
    }
    
    this.currentStatus = status;
    this.statusSubject.next(status);
  }
}
