import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { adminAuthGuard } from './admin-auth.guard';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('adminAuthGuard (Angular 19)', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    // mocks simples, tu peux les enrichir selon tes besoins
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/admin' } as RouterStateSnapshot;
  });

  it('should allow access if user is admin', () => {
    authServiceSpy.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminAuthGuard(route, state)
    );

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login if user is not admin', () => {
    authServiceSpy.isAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      adminAuthGuard(route, state)
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});


describe('adminAuthGuard2', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => adminAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
