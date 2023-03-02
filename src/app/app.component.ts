import { Component, HostListener, OnInit } from '@angular/core';
import { PeerService } from './services/peer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  constructor(private readonly peerService: PeerService) {}

  ngOnInit() {
  }
  
  @HostListener('window:unload', [ '$event' ])
  unloadHandler(event) {
    console.log("unloading...");
  }

  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event) {
    this.peerService.sendEndChatSignal();
  }
}
