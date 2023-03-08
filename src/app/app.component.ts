import { Component, HostListener, OnInit } from '@angular/core';
import { PeerService } from './services/peer.service';
import { TranslateService } from '@ngx-translate/core';
import { UserCountService } from './services/userCount.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  
  constructor(private readonly peerService: PeerService, translate: TranslateService, private readonly userCountService: UserCountService) {
    translate.addLangs(['en-US', 'fr', 'es']);
    translate.setDefaultLang('en-US');
    translate.use(window.navigator.language);
  }

  ngOnInit() {
  }
  
  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event) {
    // respond to browser close, refresh, etc. by telling the other peer the chat has ended
    this.peerService.sendEndChatSignal();
    this.userCountService.removeFromUserCount().subscribe();
  }
}
