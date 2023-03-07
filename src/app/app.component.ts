import { Component, HostListener, OnInit } from '@angular/core';
import { PeerService } from './services/peer.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  
  constructor(private readonly peerService: PeerService, translate: TranslateService) {
    translate.addLangs(['en', 'fr', 'es']);
    translate.setDefaultLang('en');
    translate.use(window.navigator.language);
  }

  ngOnInit() {
  }
  
  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event) {
    // respond to browser close, refresh, etc. by telling the other peer the chat has ended
    this.peerService.sendEndChatSignal();
  }
}
