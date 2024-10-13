import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { filter } from 'rxjs/operators'; // For filtering events

@Component({
  selector: 'app-intitial-dialog',
  templateUrl: './intitial-dialog.component.html',
  styleUrls: ['./intitial-dialog.component.scss']
})
export class IntitialDialogComponent implements OnInit {
  disableSubject = new BehaviorSubject(true);
  disableObservable = this.disableSubject.asObservable();

  constructor(
    private readonly router: Router,
    private dialogRef: MatDialogRef<IntitialDialogComponent>
  ) { }

  ngOnInit(): void {
    // Listen for NavigationEnd event to know when navigation has finished
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Close the dialog after navigation ends
      this.dialogRef.close();
      console.log("Dialog Closed after navigation");
    });
  }

  disableContinueButton(event: any) {
    this.disableSubject.next(!event.checked);
    localStorage.setItem('Non-Minor-User', 'true');
  }

  continueToVideoChat() {
    console.log("Continuing to Video Chat");
  }

  closeDialogAndNavigate(link: string) {
    console.log("Navigating to", link);

    // First, navigate to the TOS page (or any other route)
    this.router.navigate([link]);
  }
}
