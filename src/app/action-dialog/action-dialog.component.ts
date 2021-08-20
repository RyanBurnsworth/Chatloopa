import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { DialogService } from '../services/dialog.service';

@Component({
  selector: 'app-action-dialog',
  templateUrl: './action-dialog.component.html',
  styleUrls: ['./action-dialog.component.scss']
})
export class ActionDialogComponent {
  icon: string;
  title: string;
  message: string;
  positiveButtonText: string;
  negativeButtonText: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ActionDialogComponent>,
    private dialogService: DialogService, ) { 
      this.icon = data.icon;
      this.title = data.title;
      this.message = data.message;
      this.positiveButtonText = data.positiveButtonText;
      this.negativeButtonText = data.negativeButtonText;
    }

  action(value: string) {
    this.dialogService.emitEvent(value);
    this.dialogRef.close(true);
  }
}
