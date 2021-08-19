import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  loadingSubject = new BehaviorSubject(false);
  
  constructor() { }

  setLoadingStatus(status: boolean) {
    this.loadingSubject.next(status);
  }
}
