import { Injectable } from '@angular/core';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { ActionDialogComponent } from '../action-dialog/action-dialog.component';
import { ProgressDialogComponent } from '../progress-dialog/progress-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private eventSubject = new Subject();
  event$ = this.eventSubject.asObservable();

  private dialogRef: MatDialogRef<any, any>;

  constructor(private readonly dialog: MatDialog) { }

  private buildDialog<T>(dialogData: new (...args: any[]) => T, data: any): MatDialogRef<T, any> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = data;
    dialogConfig.disableClose = true;
    dialogConfig.backdropClass = 'blured';
    this.dialogRef = this.dialog.open(dialogData, dialogConfig);
    return this.dialogRef;
  }

  openActionDialog(data: any) {
    this.buildDialog(ActionDialogComponent, data);
  }

  openProgressDialog(data: any) {
    this.buildDialog(ProgressDialogComponent, data);
  }

  emitEvent(event: any) {
    this.eventSubject.next(event);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
