import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-remote-video',
  templateUrl: './remote-video.component.html',
  styleUrls: ['./remote-video.component.scss']
})
export class RemoteVideoComponent implements OnInit {
  sourceObject: any;
  isSearching: boolean = false;
  statusText: string = '';

  constructor(private readonly loadingService: LoadingService) { }

  ngOnInit(): void {
    this.loadingService.isSearching.subscribe((isSearching) => this.isSearching = isSearching);

    this.loadingService.loadingStatus.subscribe((statusText) => this.statusText = statusText);
  }
}
