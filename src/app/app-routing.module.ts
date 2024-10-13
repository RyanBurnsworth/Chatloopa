import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebConferenceComponent } from './components/web-conference/web-conference.component';
import { TosComponent } from './components/tos/tos.component';

const routes: Routes = [
  { path: '', component: WebConferenceComponent },
  { path: 'tos', component: TosComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
