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
    translate.addLangs(['en', 'en-US', 'fr', 'fr-CH', 'fr-CA', 'fr-CM', 'fr-HT', 'fr-MC', 'fr-NE', 'fr-SC', 'fr-FR', 'fr-BE', 'fr-BI', 'fr-BJ', 'fr-DJ', 'fr-DZ', 'fr-GA', 'fr-GN', 'fr-GP', 'fr-KM', 'fr-LU', 'fr-MA', 'fr-MG', 'fr-ML', 'fr-MQ', 'fr-MR', 'fr-MU', 'fr-RW', 'fr-SN', 'fr-SY', 'fr-TD', 'fr-TG', 'fr-TN', 'fr-VU', 'fr-YT', 'fr-RE', 'fr-NC', 'fr-CI', 'fr-BL', 'fr-MF', 'fr-BF', 'fr-GF', 'fr-GQ', 'fr-PR', 'fr-CD', 'fr-CG', 'fr-CF', 'fr-WF', 'fr-PM', 'es', 'es-NI', 'es-AR', 'es-BO', 'es-BR', 'es-BZ', 'es-CL', 'es-CO', 'es-CU', 'es-EC', 'es-ES', 'es-GT', 'es-MX', 'es-PA', 'es-PE', 'es-PN', 'es-UY', 'es-VE', 'es-419', 'es-IC', 'es-CR', 'es-DO', 'es-GQ', 'es-PR', 'es-SV', 'es-US', 'es-EA']);
    translate.setDefaultLang('en-US');
    translate.use(window.navigator.language);
  }

  ngOnInit() {
  }
  
  // TODO: Need to update his when refactoring the peer service
  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event) {
    // respond to browser close, refresh, etc. by telling the other peer the chat has ended
    
    //this.peerService.sendEndChatSignal();
    //this.userCountService.removeFromUserCount().subscribe();
  }
}
