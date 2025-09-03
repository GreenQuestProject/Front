import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { catchError, filter, switchMap, take, throwError, BehaviorSubject } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const accessToken = tokenService.getAccessToken();
  const bypass = ['/login', '/register', '/token/refresh'];
  const isBypassed = bypass.some(path => req.url.endsWith(path));

  if (isBypassed) {
    return next(req);
  }

  if (accessToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap(res => {
              isRefreshing = false;
              refreshTokenSubject.next(res.token);

              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.token}`
                }
              });
              return next(clonedRequest);
            }),
            catchError(refreshError => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => {
              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`
                }
              });
              return next(clonedRequest);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
