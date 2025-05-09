import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, throwError} from 'rxjs';
import {tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {User} from '../interfaces/user';
import {TokenService} from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private apiUrl: string = "http://localhost:8000"

  constructor(private http: HttpClient, private router: Router, private tokenService: TokenService) {}

  login(username: string, password: string): Observable<User> {
    const user = {username:username, password: password};
    return this.http.post<{ token: string; refresh_token: string; user: User }>(this.apiUrl+'/api/login', user).pipe(
      tap(res => {
        this.tokenService.setAccessToken(res.token);
        this.tokenService.setRefreshToken(res.refresh_token);
        this.loadUserFromToken().subscribe(user => {
          this.currentUserSubject.next(user);
        });
      }),
      map(() => this.currentUserSubject.value as User)
    );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public initializeAuth(): Observable<User | null> {
    const token = this.tokenService.getAccessToken();
    if (token) {
      return this.loadUserFromToken().pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        }),
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
    } else {
      this.currentUserSubject.next(null);
      return of(null);
    }
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/api/refresh`, { refreshToken }).pipe(
      tap(res => {
        this.tokenService.setAccessToken(res.accessToken);
      })
    );
  }

  loadUserFromToken(): Observable<User | null> {
    const accessToken = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();

    if (!accessToken && refreshToken) {
      return this.refreshToken().pipe(
        switchMap(() => this.loadUserFromToken()),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    }

    if (accessToken) {
      return this.http.get<User>(`${this.apiUrl}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }).pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    }

    return of(null);
  }

  isLoggedIn(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => !!user)
    );
  }

  isAdmin(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => user?.role?.includes('admin') ?? false)
    );
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  register(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl+'/api/register', user);
  }

}
