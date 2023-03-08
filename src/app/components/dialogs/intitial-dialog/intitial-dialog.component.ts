import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-intitial-dialog',
  templateUrl: './intitial-dialog.component.html',
  styleUrls: ['./intitial-dialog.component.scss']
})
export class IntitialDialogComponent implements OnInit {
  disableSubject = new BehaviorSubject(true);
  disableObservable = this.disableSubject.asObservable();

  constructor() { }

  ngOnInit(): void {
  }

  disableContinueButton(event: any) {
    this.disableSubject.next(!event.checked);
  }
}
