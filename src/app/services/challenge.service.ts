import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Challenge} from '../interfaces/challenge';
import {ChallengeStatus} from '../interfaces/challenge-status';
import {ChallengeCategory} from '../interfaces/challenge-category';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private apiUrl: string = environment.apiUrl

  constructor(private http: HttpClient) {
  }

  getChallenges(categories?: string[]): Observable<Challenge[]> {
    let params = new HttpParams();
    if (categories && categories.length > 0) {
      params = params.set('category', categories.join(','));
    }
    return this.http.get<Challenge[]>(this.apiUrl + '/challenge', {params});
  }

  getChallengeCategories(): Observable<ChallengeCategory[]> {
    return this.http.get<ChallengeCategory[]>(this.apiUrl + '/challenge/enums/categories');
  }

  getChallengeStatus(): Observable<ChallengeStatus[]> {
    return this.http.get<ChallengeStatus[]>(this.apiUrl + '/challenge/enums/status');
  }

  getChallenge(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.apiUrl}/challenge/${id}`);
  }

}
