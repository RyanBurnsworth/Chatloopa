import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IntitialDialogComponent } from '../dialogs/intitial-dialog/intitial-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  constructor(private dialog: MatDialog) { 
  }

  ngAfterViewInit(): void {
    this.dialog.open(IntitialDialogComponent, {
      panelClass: 'dialog-style',
      disableClose: true,
      autoFocus: true
    });
  }
}
