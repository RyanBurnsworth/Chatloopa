import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isSearching = new BehaviorSubject(false);
  
  loadingStatus  = new BehaviorSubject('');

  constructor() { }

  setIsSearching(status: boolean) {
    this.isSearching.next(status);
  }

  setLoadingStatus(status: string) {
    this.loadingStatus.next(status);
  }
}
