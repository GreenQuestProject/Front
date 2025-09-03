import {Routes} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {childAuthGuard} from './guards/child-auth.guard';
import {RegisterComponent} from './register/register.component';
import {loginRedirectGuard} from './guards/login-redirect.guard';
import {ChallengeListComponent} from './challenge-list/challenge-list.component';
import {ProgressionListComponent} from './progression-list/progression-list.component';
import {ParametersComponent} from './parameters/parameters.component';
import {ArticlesComponent} from './articles/articles.component';
import {AnalyticsComponent} from './analytics/analytics.component';

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
    path: '', redirectTo: '/défis', pathMatch: 'full'
  },
  {path: 'paramètres', component: ParametersComponent, canActivate: [childAuthGuard]},
  {path: 'articles', component: ArticlesComponent, canActivate: [childAuthGuard]},
  {path: 'statistiques', component: AnalyticsComponent, canActivate: [childAuthGuard]},
];
