import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {adminAuthGuard} from './admin-auth.guard';
import {AuthService} from '../services/auth.service';
import {firstValueFrom, Observable, of} from 'rxjs';

describe('adminAuthGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        {provide: AuthService, useValue: authServiceSpy},
        {provide: Router, useValue: routerSpy}
      ]
    });
  });

  it('should allow activation if user is admin', async () => {
    authServiceSpy.isAdmin.and.returnValue(of(true));

    const result = await TestBed.runInInjectionContext(async () => {
      const result$ = adminAuthGuard(route, state);
      return await firstValueFrom(result$ as Observable<boolean>);
    });

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login if user is not admin', async () => {
    authServiceSpy.isAdmin.and.returnValue(of(false));

    const result = await TestBed.runInInjectionContext(async () => {
      const result$ = adminAuthGuard(route, state);
      return await firstValueFrom(result$ as Observable<boolean>);
    });

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
