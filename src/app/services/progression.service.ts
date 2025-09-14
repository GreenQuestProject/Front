import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Progression} from '../interfaces/progression';

@Injectable({
  providedIn: 'root'
})
export class ProgressionService {
  private apiUrl: string = environment.apiUrl + '/progression';

  constructor(private http: HttpClient) {
  }

  getProgressions(categories?: string[], status?: string[]): Observable<Progression[]> {
    let params = new HttpParams();
    if (categories && categories.length > 0) {
      params = params.set('type', categories.join(','));
    }
    if (status && status.length > 0) {
      params = params.set('status', status.join(','));
    }
    return this.http.get<Progression[]>(this.apiUrl, {params});
  }

  startChallenge(challengeId: number) {
    return this.http.post(this.apiUrl + `/start/${challengeId}`, {});
  }

  removeChallenge(challengeId: number) {
    return this.http.delete(this.apiUrl + `/remove/${challengeId}`, {});
  }

  validateChallenge(challengeId: number) {
    return this.http.post(this.apiUrl + `/validate/${challengeId}`, {});
  }

  updateStatus(progressionId: number, status: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/status/${progressionId}`, {status});
  }

}
