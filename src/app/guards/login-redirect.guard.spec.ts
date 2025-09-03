import {TestBed} from '@angular/core/testing';
import {loginRedirectGuard} from './login-redirect.guard';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {Observable, of} from 'rxjs';

describe('loginRedirectGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['initializeAuth', 'isLoggedIn']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        {provide: AuthService, useValue: authServiceSpy},
        {provide: Router, useValue: routerSpy},
      ],
    });

    route = {} as ActivatedRouteSnapshot;
    state = {url: '/some-url'} as RouterStateSnapshot;
  });

  it('should redirect to /défis when user is logged in', (done) => {
    authServiceSpy.isLoggedIn.and.returnValue(of(true));
    authServiceSpy.initializeAuth.and.returnValue(of(null));

    TestBed.runInInjectionContext(() => {
      const result = loginRedirectGuard(route, state);

      if (result instanceof Observable) {
        result.subscribe(r => {
          expect(r).toBeFalse();
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/défis']);
          done();
        });
      } else {
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/défis']);
        done();
      }
    });
  });

  it('should allow access when user is not logged in', (done) => {
    authServiceSpy.isLoggedIn.and.returnValue(of(false));
    authServiceSpy.initializeAuth.and.returnValue(of(null));

    TestBed.runInInjectionContext(() => {
      const result = loginRedirectGuard(route, state);

      if (result instanceof Observable) {
        result.subscribe(r => {
          expect(r).toBeTrue();
          expect(routerSpy.navigate).not.toHaveBeenCalled();
          done();
        });
      } else {
        expect(result).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
