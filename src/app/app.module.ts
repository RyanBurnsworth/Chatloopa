import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WebConferenceComponent } from './web-conference/web-conference.component';
import { RemoteVideoComponent } from './remote-video/remote-video.component';
import { LocalVideoComponent } from './local-video/local-video.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { WebChatComponent } from './web-chat/web-chat.component';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ActionDialogComponent } from './action-dialog/action-dialog.component';
import { ProgressDialogComponent } from './progress-dialog/progress-dialog.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

@NgModule({
  declarations: [
    AppComponent,
    WebConferenceComponent,
    RemoteVideoComponent,
    LocalVideoComponent,
    WebChatComponent,
    ActionDialogComponent,
    ProgressDialogComponent,
  ],
  imports: [
    BrowserModule,
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
  ],
  providers: [ {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
