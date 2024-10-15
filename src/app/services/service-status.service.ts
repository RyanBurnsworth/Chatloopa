import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceStatusService {
  private serviceStatusSubject = new Subject<string>();
  private serviceStatus$ = this.serviceStatusSubject.asObservable();

  constructor() { }

  /**
   * Update the service status
   * 
   * @param status the status of the service
   */
  updateServiceStatus(status: string) {
    this.serviceStatusSubject.next(status);
  }

  /**
   * Get the service status
   * 
   * @returns the service status
   */
  getServiceStatusListener() {
    return this.serviceStatus$;
  }
}
