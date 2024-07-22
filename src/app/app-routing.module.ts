import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TextChatComponent } from './components/text-chat/text-chat.component';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' }, //default route
  { path: 'home', component: TextChatComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
