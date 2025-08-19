import { TestBed } from '@angular/core/testing';
import { loginRedirectGuard } from './login-redirect.guard';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {Observable, of} from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('loginRedirectGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    // Création des mocks pour AuthService et Router
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['initializeAuth', 'isLoggedIn']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // Configuration du module de test
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    // Initialisation des objets de route
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/some-url' } as RouterStateSnapshot;
  });

  it('should redirect to /défis when user is logged in', (done) => {
    // Simule que l'utilisateur est connecté
    authServiceSpy.isLoggedIn.and.returnValue(of(true));
    authServiceSpy.initializeAuth.and.returnValue(of(null));

    // Exécution du guard dans le contexte d'injection
    TestBed.runInInjectionContext(() => {
      const result = loginRedirectGuard(route, state);

      if (result instanceof Observable) {
        result.subscribe(r => {
          expect(r).toBeFalse();
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/défis']);
          done();
        });
      } else {
        // Si le résultat est un boolean directement
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/défis']);
        done();
      }
    });
  });

  it('should allow access when user is not logged in', (done) => {
    // Simule que l'utilisateur n'est pas connecté
    authServiceSpy.isLoggedIn.and.returnValue(of(false));
    authServiceSpy.initializeAuth.and.returnValue(of(null));

    // Exécution du guard dans le contexte d'injection
    TestBed.runInInjectionContext(() => {
      const result = loginRedirectGuard(route, state);

      if (result instanceof Observable) {
        result.subscribe(r => {
          expect(r).toBeTrue();
          expect(routerSpy.navigate).not.toHaveBeenCalled();
          done();
        });
      } else {
        // Si le résultat est un boolean directement
        expect(result).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
