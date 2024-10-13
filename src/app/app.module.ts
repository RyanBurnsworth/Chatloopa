import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WebConferenceComponent } from './components/web-conference/web-conference.component';
import { RemoteVideoComponent } from './components/remote-video/remote-video.component';
import { LocalVideoComponent } from './components/local-video/local-video.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IntitialDialogComponent } from './components/dialogs/intitial-dialog/intitial-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TextChatComponent } from './components/text-chat/text-chat.component';
import { HomeComponent } from './components/home/home.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    WebConferenceComponent,
    RemoteVideoComponent,
    LocalVideoComponent,
    IntitialDialogComponent,
    TextChatComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,    
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    }),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatListModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatCardModule,
    MatTooltipModule,
    MatCheckboxModule,
  ],
  providers: [ 
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}
    } 
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
