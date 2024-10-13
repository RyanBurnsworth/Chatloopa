import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-intitial-dialog',
  templateUrl: './intitial-dialog.component.html',
  styleUrls: ['./intitial-dialog.component.scss']
})
export class IntitialDialogComponent implements OnInit {
  disableSubject = new BehaviorSubject(true);
  disableObservable = this.disableSubject.asObservable();

  constructor(private readonly router: Router) { }

  ngOnInit(): void {
  }

  disableContinueButton(event: any) {
    this.disableSubject.next(!event.checked);
    localStorage.setItem('Non-Minor-User', 'true');
  }

  continueToVideoChat() {
    console.log("Continuing to Video Chat");
    
    this.router.navigate(['video']);
  }

  continueToTextChat() {
    console.log("Continuing to Text Chat");
    this.router.navigate(['text']);
  }
}
