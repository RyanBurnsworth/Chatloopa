import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TextChatComponent } from './components/text-chat/text-chat.component';
import { WebConferenceComponent } from './components/web-conference/web-conference.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  { path: '', redirectTo: '/', pathMatch: 'full' }, // Default route
  { path: '', component: HomeComponent },
  { path: 'text', component: TextChatComponent },
  { path: 'video', component: WebConferenceComponent },
  { path: '**', redirectTo: '/' } // Wildcard route for 404 handling
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
