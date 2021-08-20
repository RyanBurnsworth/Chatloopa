import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from '../services/dialog.service';

@Component({
  selector: 'app-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.scss']
})
export class ProgressDialogComponent {
  icon: string;
  title: string;
  message: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ProgressDialogComponent>,
    private dialogService: DialogService, ) { 
      this.icon = data.icon;
      this.title = data.title;
      this.message = data.message;
    }
    
  close() {
    this.dialogService.emitEvent('cancelled');
    this.dialogRef.close(true);
  }
}
