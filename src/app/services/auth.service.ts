import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, throwError} from 'rxjs';
import {tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {User} from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private accessToken: string | null = null;
  private apiUrl: string = "http://localhost:8000"

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<User> {
    const user = {username:username, password: password};
    return this.http.post<{ token: string; refresh_token: string; user: User }>(this.apiUrl+'/api/login', user).pipe(
      tap(res => {
        this.accessToken = res.token;
        localStorage.setItem('refreshToken', res.refresh_token); // store refresh token
        const user: User | null = this.decodeToken(this.accessToken);
        this.currentUserSubject.next(user);
      }),
     map(res => user)
    );
  }

  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http.post<{ accessToken: string }>(this.apiUrl+'/api/refresh', { refreshToken }).pipe(
      tap(res => this.accessToken = res.accessToken)
    );
  }

  loadUserFromToken(): Observable<User | null> {
    const access = this.accessToken;
    const refresh = localStorage.getItem('refreshToken');

    if (!access && refresh) {
      return this.refreshToken().pipe(
        switchMap(() => this.http.get<User>(this.apiUrl+'/api/me')),
        tap(user => this.currentUserSubject.next(user)),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    }

    if (access) {
      return this.http.get<User>(this.apiUrl+'/api/me').pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    }

    return of(null);
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role?.includes('admin') ?? false;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }
  decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.username || '',
        password: "",
        role: payload.roles || []
      };
    } catch {
      return null;
    }
  }
}
