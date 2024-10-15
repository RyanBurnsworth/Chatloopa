import { Component } from '@angular/core';
import { StatusService } from 'src/app/services/status.service';
import { SEARCHING, CONNECTING, CONNECTED, DISCONNECTED, FAILED, CLOSED, PERMISSION_ERROR } from 'src/app/shared/constants';

@Component({
  selector: 'app-generic-video',
  standalone: false,
  templateUrl: './generic-video.component.html',
  styleUrl: './generic-video.component.scss'
})
export class GenericVideoComponent {
  sourceObject: any;
  statusText: string = '';
  showProgressSpinner: boolean = false;

  constructor(private readonly statusService: StatusService) { }

  ngOnInit(): void {

    // update the status text and visibility of progress spinner based on the connection status
    this.statusService.status$.subscribe((status) => {
      switch (status) {
        case SEARCHING:
          this.showProgressSpinner = true;
          this.statusText = 'Searching for a peer...';
          break;
        case CONNECTING:
          this.showProgressSpinner = true;
          this.statusText = 'Connecting to Peer...';
          break;
        case CONNECTED:
          this.showProgressSpinner = false;
          this.statusText = '';
          break;
        case DISCONNECTED:
          this.showProgressSpinner = false;
          this.statusText = 'Disconnected from Peer';
          break;
        case FAILED:
          this.showProgressSpinner = false;
          this.statusText = 'Connection Failed';
          break;
        case CLOSED:
          this.showProgressSpinner = false;
          this.statusText = 'Connection Closed by Peer';
          break;
        case PERMISSION_ERROR:
          this.showProgressSpinner = false;
          this.statusText = 'Permission Error: Cannot Access Camera/Microphone';
          break;
        default:
          this.showProgressSpinner = false;
          this.statusText = '';
          break;
      };
    });
  }
}
