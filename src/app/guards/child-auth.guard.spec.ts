import { TestBed } from '@angular/core/testing';
import { CanActivateChildFn } from '@angular/router';
import { childAuthGuard } from './child-auth.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {Observable, of} from 'rxjs';

describe('childAuthGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn', 'initializeAuth']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    route = {} as ActivatedRouteSnapshot;
    state = { url: '/protected-child-route' } as RouterStateSnapshot;
  });

  it('should allow access when user is logged in', (done) => {
    // Simule que l'utilisateur est connecté
    authServiceSpy.isLoggedIn.and.returnValue(of(true));
    authServiceSpy.initializeAuth.and.returnValue(of(null));

    // Exécution dans un contexte d'injection valide
    TestBed.runInInjectionContext(() => {
      const result = childAuthGuard(route, state);

      // Assure-toi que le résultat est un observable et s'abonne
      if (result instanceof Observable) {
        result.subscribe(r => {
          expect(r).toBeTrue();
          expect(routerSpy.navigate).not.toHaveBeenCalled();
          done();
        });
      } else {
        // Si le résultat est une valeur booléenne synchrone
        expect(result).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('should deny access and redirect to login when user is not logged in', (done) => {
    // Simule que l'utilisateur n'est pas connecté
    authServiceSpy.isLoggedIn.and.returnValue(of(false));
    authServiceSpy.initializeAuth.and.returnValue(of(null));

    // Exécution dans un contexte d'injection valide
    TestBed.runInInjectionContext(() => {
      const result = childAuthGuard(route, state);

      // Assure-toi que le résultat est un observable et s'abonne
      if (result instanceof Observable) {
        result.subscribe(r => {
          expect(r).toBeFalse();
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
          done();
        });
      } else {
        // Si le résultat est une valeur booléenne synchrone
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });
});
