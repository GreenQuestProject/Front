import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {Challenge} from '../interfaces/challenge';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private apiUrl: string = environment.apiUrl
  constructor(private http: HttpClient, private router: Router) { }
/*
  getChallenges(): Observable<Challenge[]>{
    return this.http.get<Challenge[]>(this.apiUrl+'/challenge');
  }
  */
  getChallenges(categories?: string[]): Observable<Challenge[]> {
  let params = new HttpParams();
  if (categories && categories.length > 0) {
    params = params.set('category', categories.join(','));
  }
  return this.http.get<Challenge[]>(this.apiUrl+'/challenge', { params });
}

}
