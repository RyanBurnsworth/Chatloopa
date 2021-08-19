import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-local-video',
  templateUrl: './local-video.component.html',
  styleUrls: ['./local-video.component.scss']
})
export class LocalVideoComponent implements OnInit {
  sourceObject: any;
  
  constructor() { }

  ngOnInit(): void {
  }
}
