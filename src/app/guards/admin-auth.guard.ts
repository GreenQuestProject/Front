import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {map, tap} from 'rxjs/operators';

export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAdmin().pipe(
    tap(isAdmin => {
      if (!isAdmin) {
        router.navigate(['/login']);
      }
    }),
    map(isAdmin => isAdmin)
  );
};

