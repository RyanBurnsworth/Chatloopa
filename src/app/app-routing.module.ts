import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebConferenceComponent } from './components/web-conference/web-conference.component';

const routes: Routes = [
  { path: '', component: WebConferenceComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
