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
  
  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event) {
    // respond to browser close, refresh, etc. by telling the other peer the chat has ended
    this.peerService.sendEndChatSignal();
  }
}
