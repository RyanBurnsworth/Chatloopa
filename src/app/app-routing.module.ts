import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebConferenceComponent } from './components/web-conference/web-conference.component';
import { TosComponent } from './components/tos/tos.component';
import { VideoTextComponent } from './components/video-text/video-text.component';
import { TextChatComponent } from './components/text-chat/text-chat.component';

const routes: Routes = [
  { path: '', component: WebConferenceComponent },
  { path: 'tos', component: TosComponent },
  { path: 'text', component: TextChatComponent },
  { path: 'chat', component: VideoTextComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
