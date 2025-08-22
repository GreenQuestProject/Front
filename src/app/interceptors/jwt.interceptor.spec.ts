import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {of, Subject, throwError} from 'rxjs';

import { jwtInterceptor } from './jwt.interceptor';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  let tokenSpy: jasmine.SpyObj<TokenService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    tokenSpy = jasmine.createSpyObj<TokenService>('TokenService', [
      'getAccessToken',
      'getRefreshToken',
      'setAccessToken',
      'setRefreshToken',
      'clearTokens',
    ]);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'refreshToken',
      'logout',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenService, useValue: tokenSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('ajoute Authorization: Bearer <token> quand un accessToken existe', () => {
    tokenSpy.getAccessToken.and.returnValue('OLD_TOKEN');

    http.get('/api/data').subscribe();
    const req = httpMock.expectOne('/api/data');

    expect(req.request.headers.get('Authorization')).toBe('Bearer OLD_TOKEN');

    req.flush({ ok: true });
  });

  it("n'injecte pas d'en-tête Authorization pour l'URL de refresh", () => {
    tokenSpy.getAccessToken.and.returnValue('OLD_TOKEN'); // ne doit pas être utilisé

    http.post('/token/refresh', { refresh_token: 'R1' }).subscribe();
    const req = httpMock.expectOne('/token/refresh');

    expect(req.request.headers.has('Authorization')).toBeFalse();

    req.flush({ token: 'NEW', refresh_token: 'R2' });
  });

  it('401 → refresh OK → rejoue la requête avec le nouveau token', () => {
    tokenSpy.getAccessToken.and.returnValue('OLD_TOKEN');
    // Le service d’auth renvoie le nouveau token
    authSpy.refreshToken.and.returnValue(of({ token: 'NEW_TOKEN', refresh_token: 'R2' }));

    let result: any;
    http.get('/api/protected').subscribe(res => (result = res));

    // 1re requête (avec OLD_TOKEN)
    const first = httpMock.expectOne('/api/protected');
    expect(first.request.headers.get('Authorization')).toBe('Bearer OLD_TOKEN');
    // Simule 401
    first.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Rejoue la requête (après refresh) avec NEW_TOKEN
    const retried = httpMock.expectOne('/api/protected');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer NEW_TOKEN');
    retried.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(authSpy.refreshToken).toHaveBeenCalledTimes(1);
    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('401 → refresh échoue → appelle logout() et propage une erreur', (done) => {
    tokenSpy.getAccessToken.and.returnValue('OLD_TOKEN');
    authSpy.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));

    http.get('/api/protected').subscribe({
      next: () => done.fail('devrait échouer'),
      error: (err) => {
        expect(authSpy.refreshToken).toHaveBeenCalledTimes(1);
        expect(authSpy.logout).toHaveBeenCalledTimes(1);
        expect(err).toBeTruthy();
        done();
      },
    });

    // 1re requête → 401
    const first = httpMock.expectOne('/api/protected');
    first.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
    // pas de seconde requête car le refresh a échoué → l’erreur est propagée
  });

it('deux requêtes concurrentes: un seul refresh, les deux sont rejouées avec NEW_TOKEN', () => {
  tokenSpy.getAccessToken.and.returnValue('OLD_TOKEN');

  // ← refresh asynchrone contrôlé
  const refresh$ = new Subject<{ token: string; refresh_token: string }>();
  authSpy.refreshToken.and.returnValue(refresh$.asObservable());

  const results: any[] = [];
  http.get('/api/protected').subscribe(r => results.push(r));
  http.get('/api/protected').subscribe(r => results.push(r));

  // Les 2 requêtes initiales partent avec l’ancien token
  const initial = httpMock.match('/api/protected');
  expect(initial.length).toBe(2);
  expect(initial[0].request.headers.get('Authorization')).toBe('Bearer OLD_TOKEN');
  expect(initial[1].request.headers.get('Authorization')).toBe('Bearer OLD_TOKEN');

  // 1) On renvoie 401 pour la première → démarre le refresh (isRefreshing=true)
  initial[0].flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
  expect(authSpy.refreshToken).toHaveBeenCalledTimes(1);

  // 2) Pendant que le refresh est EN COURS, on renvoie 401 pour la deuxième
  //    → elle NE déclenche PAS un second refresh, elle s'abonne au subject.
  initial[1].flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
  expect(authSpy.refreshToken).toHaveBeenCalledTimes(1); // toujours 1

  // 3) Le refresh se résout → on émet le nouveau token
  refresh$.next({ token: 'NEW_TOKEN', refresh_token: 'R2' });
  refresh$.complete();

  // 4) Les deux requêtes sont rejouées avec le NOUVEAU token
  const retried = httpMock.match('/api/protected');
  expect(retried.length).toBe(2);
  expect(retried[0].request.headers.get('Authorization')).toBe('Bearer NEW_TOKEN');
  expect(retried[1].request.headers.get('Authorization')).toBe('Bearer NEW_TOKEN');

  retried[0].flush({ ok: 1 });
  retried[1].flush({ ok: 2 });

  expect(results).toEqual([{ ok: 1 }, { ok: 2 }]);
  expect(authSpy.refreshToken).toHaveBeenCalledTimes(1);
  expect(authSpy.logout).not.toHaveBeenCalled();
});

  it("propage les autres erreurs HTTP telles quelles (sans refresh) si ce n'est pas un 401", (done) => {
    tokenSpy.getAccessToken.and.returnValue('OLD_TOKEN');

    http.get('/api/protected').subscribe({
      next: () => done.fail('devrait échouer'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(authSpy.refreshToken).not.toHaveBeenCalled();
        expect(authSpy.logout).not.toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer OLD_TOKEN');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
  });
});
