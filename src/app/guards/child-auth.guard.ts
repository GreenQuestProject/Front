import {CanActivateChildFn} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {map, switchMap, take} from 'rxjs';

export const childAuthGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initializeAuth().pipe(
    switchMap(() => authService.isLoggedIn()),
    take(1),
    map(isLogged => {
      if (!isLogged) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};
