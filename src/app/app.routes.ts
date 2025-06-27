import { Routes } from '@angular/router';
import {adminAuthGuard} from './guards/admin-auth.guard';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {childAuthGuard} from './guards/child-auth.guard';
import {RegisterComponent} from './register/register.component';
import {loginRedirectGuard} from './guards/login-redirect.guard';
import {ChallengeListComponent} from './challenge-list/challenge-list.component';
import {ProgressionListComponent} from './progression-list/progression-list.component';

export const routes: Routes = [
  {
    path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard]
  },
  {
    path: 'register', component: RegisterComponent
  },
  {
    path: 'accueil',
    component: HomeComponent,
    canActivate: [childAuthGuard],
    children: [
      //{ path: 'défis', component: ChallengeListComponent },
     // { path: 'settings', component: SettingsComponent },
     // { path: 'profile', component: ProfileComponent },
    ]
  },
  {
    path: 'défis',
    component: ChallengeListComponent,
    canActivate: [childAuthGuard]
  },
  {
    path: 'progression',
    component: ProgressionListComponent,
    canActivate: [childAuthGuard]
  },
  {
    path: '', redirectTo: '/accueil', pathMatch: 'full'
  },
];
