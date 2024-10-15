import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { filter } from 'rxjs/operators'; // For filtering events
import { AnalyticsService } from 'src/app/services/analytics.service';
import { BUTTON_CLICK_EVENT, CONTINUE_BUTTON, LINK_CLICK_EVENT, TOS_LINK } from 'src/app/shared/constants';

@Component({
  selector: 'app-intitial-dialog',
  templateUrl: './tos-agreement-dialog.component.html',
  styleUrls: ['./tos-agreement-dialog.component.scss']
})
export class TosAgreementDialog implements OnInit {
  disableSubject = new BehaviorSubject(true);
  disableObservable = this.disableSubject.asObservable();

  constructor(
    private readonly router: Router,
    private readonly analyticsService: AnalyticsService,
    private dialogRef: MatDialogRef<TosAgreementDialog>
  ) { }

  ngOnInit(): void {
    // Listen for NavigationEnd event to know when navigation has finished
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Close the dialog after navigation ends
      this.dialogRef.close();
    });
  }

  disableContinueButton(event: any) {
    this.disableSubject.next(!event.checked);
    localStorage.setItem('Non-Minor-User', 'true');
    this.analyticsService.trackEvent('Non_Minor_Checkbox_Click', 'User clicked the checkbox', 'Checkbox_Click');
  }

  continueToVideoChat() {
    this.analyticsService.trackEvent(CONTINUE_BUTTON, 'User clicked the continue button', BUTTON_CLICK_EVENT);
  }

  closeDialogAndNavigate(link: string) {
    // Track the event
    this.analyticsService.trackEvent(TOS_LINK, 'User visited the TOS page', LINK_CLICK_EVENT);

    // First, navigate to the TOS page (or any other route)
    this.router.navigate([link]);
  }
}
