import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-remote-video',
  templateUrl: './remote-video.component.html',
  styleUrls: ['./remote-video.component.scss']
})
export class RemoteVideoComponent implements OnInit {
  sourceObject: any;
  isLoading: boolean = false;

  constructor(private readonly loadingService: LoadingService) { }

  ngOnInit(): void {
    this.loadingService.loadingSubject.subscribe((status) => this.isLoading = status );
  }
}
