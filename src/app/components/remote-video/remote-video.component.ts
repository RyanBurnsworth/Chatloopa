import { Component, OnInit } from '@angular/core';
import { StatusService } from 'src/app/services/status.service';
import { CLOSED, CONNECTED, CONNECTING, DISCONNECTED, FAILED, SEARCHING } from 'src/app/shared/constants';

@Component({
  selector: 'app-remote-video',
  templateUrl: './remote-video.component.html',
  styleUrls: ['./remote-video.component.scss']
})
export class RemoteVideoComponent implements OnInit {
  sourceObject: any;
  showProgressSpinner: boolean = false;
  statusText: string = '';

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
        default:
          this.showProgressSpinner = false;
          this.statusText = '';
          break;
      };
    });
  }
}
