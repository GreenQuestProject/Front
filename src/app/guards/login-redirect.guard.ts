import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {map, switchMap, take} from 'rxjs';

export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initializeAuth().pipe(
    switchMap(() => authService.isLoggedIn()),
    take(1),
    map(isLogged => {
      if (isLogged) {
        router.navigate(['/accueil']);
        return false;
      }
      return true;
    })
  );
};
