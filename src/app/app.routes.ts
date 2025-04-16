import { Routes } from '@angular/router';
import {adminAuthGuard} from './guards/admin-auth.guard';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';

export const routes: Routes = [
 /* {
    path: 'admin',
    //TODO: créer AdminComponent
    //component: AdminComponent,
    canActivate: [adminAuthGuard]
  },*/
  {
    path: 'login', component: LoginComponent
  },
  {
    path: 'accueil', component: HomeComponent
  },
];
