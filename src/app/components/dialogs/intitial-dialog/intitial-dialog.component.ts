import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { filter } from 'rxjs/operators'; // For filtering events
import { AnalyticsService } from 'src/app/services/analytics.service';

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
    private readonly analyticsService: AnalyticsService,
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
    this.analyticsService.trackEvent('Non_Minor_Checkbox_Click', 'User clicked the checkbox', 'Checkbox_Click');
  }

  continueToVideoChat() {
    console.log("Continuing to Video Chat");
    this.analyticsService.trackEvent('Continue_Button_Click', 'User clicked the continue button', 'Button_Click');
  }

  closeDialogAndNavigate(link: string) {
    console.log("Navigating to", link);

    // Track the event
    this.analyticsService.trackEvent('TOS_Link_Click', 'User visited the TOS page', 'Link_Click');

    // First, navigate to the TOS page (or any other route)
    this.router.navigate([link]);
  }
}
