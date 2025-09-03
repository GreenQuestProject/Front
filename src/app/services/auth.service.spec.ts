import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter, Router} from '@angular/router';

import {AuthService} from './auth.service';
import {TokenService} from './token.service';
import {environment} from '../../environments/environment';
import {User} from '../interfaces/user';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenSpy: jasmine.SpyObj<TokenService>;
  let router: Router;

  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    tokenSpy = jasmine.createSpyObj<TokenService>('TokenService', [
      'getAccessToken',
      'getRefreshToken',
      'setAccessToken',
      'setRefreshToken',
      'clearTokens',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {provide: TokenService, useValue: tokenSpy},
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login émet null mais met à jour currentUser via /user/me', (done) => {
    const creds = {username: 'k', password: 'p'};
    const loginResp = {token: 'ACCESS', refresh_token: 'REFRESH', user: {} as any};
    const meResp: User = {id: 1, username: 'k', role: 'admin'} as any;

    tokenSpy.getAccessToken.and.returnValue('ACCESS');

    const sub = service.getCurrentUser().subscribe(u => {
      if (u) {
        expect(u).toEqual(meResp);
        sub.unsubscribe();
        done();
      }
    });

    service.login(creds.username, creds.password).subscribe(value => {
      expect(value).toBeNull();
    });

    const post = httpMock.expectOne(`${apiUrl}/login`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({username: 'k', password: 'p'});
    post.flush(loginResp);

    expect(tokenSpy.setAccessToken).toHaveBeenCalledWith('ACCESS');
    expect(tokenSpy.setRefreshToken).toHaveBeenCalledWith('REFRESH');

    const getMe = httpMock.expectOne(`${apiUrl}/user/me`);
    expect(getMe.request.method).toBe('GET');
    expect(getMe.request.headers.get('Authorization')).toBe('Bearer ACCESS');
    getMe.flush(meResp);
  });

  describe('logout', () => {
    it('clear tokens, currentUser=null et navigate vers /login', () => {
      service.logout();
      expect(tokenSpy.clearTokens).toHaveBeenCalled();
      service.getCurrentUser().subscribe(u => expect(u).toBeNull());
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('initializeAuth', () => {
    it('avec token → charge le user et met à jour currentUser', () => {
      tokenSpy.getAccessToken.and.returnValue('TOK');
      const meResp: User = {id: 10, username: 'x'} as unknown as User;

      service.initializeAuth().subscribe(user => {
        expect(user).toEqual(meResp);
      });

      const req = httpMock.expectOne(`${apiUrl}/user/me`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer TOK');
      req.flush(meResp);
    });

    it('avec token mais erreur → currentUser=null, renvoie null', () => {
      tokenSpy.getAccessToken.and.returnValue('TOK');

      service.initializeAuth().subscribe(user => {
        expect(user).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/user/me`);
      req.flush({message: 'boom'}, {status: 401, statusText: 'Unauthorized'});
    });

    it('sans token → renvoie null et currentUser=null', () => {
      tokenSpy.getAccessToken.and.returnValue(null);

      service.initializeAuth().subscribe(user => {
        expect(user).toBeNull();
      });
    });
  });

  describe('refreshToken', () => {
    it('succès: POST /token/refresh et met à jour les tokens', () => {
      tokenSpy.getRefreshToken.and.returnValue('R');
      const resp = {token: 'A2', refresh_token: 'R2'};

      service.refreshToken().subscribe(r => {
        expect(r).toEqual(resp);
      });

      const req = httpMock.expectOne(`${apiUrl}/token/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({refresh_token: 'R'});
      req.flush(resp);

      expect(tokenSpy.setAccessToken).toHaveBeenCalledWith('A2');
      expect(tokenSpy.setRefreshToken).toHaveBeenCalledWith('R2');
    });

    it('erreur si pas de refresh token', (done) => {
      tokenSpy.getRefreshToken.and.returnValue(null);

      service.refreshToken().subscribe({
        next: () => done.fail('Ne doit pas émettre en succès'),
        error: (e) => {
          expect(e).toBeTruthy();
          done();
        },
      });
    });
  });

  describe('loadUserFromToken', () => {
    it('avec access token → GET /user/me puis currentUser', () => {
      tokenSpy.getAccessToken.and.returnValue('A');
      const meResp: User = {id: 2, username: 'm'} as unknown as User;

      service.loadUserFromToken().subscribe(user => {
        expect(user).toEqual(meResp);
      });

      const req = httpMock.expectOne(`${apiUrl}/user/me`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer A');
      req.flush(meResp);
    });

    it('erreur sur /user/me → logout et renvoie null', () => {
      tokenSpy.getAccessToken.and.returnValue('A');

      service.loadUserFromToken().subscribe(user => {
        expect(user).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/user/me`);
      req.flush({message: 'nope'}, {status: 401, statusText: 'Unauthorized'});

      expect(tokenSpy.clearTokens).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('sans access token → renvoie null, pas d’appel réseau', () => {
      tokenSpy.getAccessToken.and.returnValue(null);

      service.loadUserFromToken().subscribe(user => {
        expect(user).toBeNull();
      });
    });
  });

  describe('isLoggedIn / isAdmin', () => {
    it('isLoggedIn true si user présent', (done) => {
      (service as any).currentUserSubject.next({id: 1} as unknown as User);

      service.isLoggedIn().subscribe(v => {
        expect(v).toBeTrue();
        done();
      });
    });

    it('isLoggedIn false si user null', (done) => {
      (service as any).currentUserSubject.next(null);

      service.isLoggedIn().subscribe(v => {
        expect(v).toBeFalse();
        done();
      });
    });

    it('isAdmin true si role contient "admin"', (done) => {
      (service as any).currentUserSubject.next({id: 1, role: 'super-admin'} as unknown as User);

      service.isAdmin().subscribe(v => {
        expect(v).toBeTrue();
        done();
      });
    });

    it('isAdmin false sinon', (done) => {
      (service as any).currentUserSubject.next({id: 1, role: 'user'} as unknown as User);

      service.isAdmin().subscribe(v => {
        expect(v).toBeFalse();
        done();
      });
    });
  });

  describe('register', () => {
    it('POST /register renvoie le User', () => {
      const newUser = {username: 'n'} as unknown as User;
      const created = {id: 99, username: 'n'} as unknown as User;

      service.register(newUser).subscribe(u => {
        expect(u).toEqual(created);
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush(created);
    });
  });
});
