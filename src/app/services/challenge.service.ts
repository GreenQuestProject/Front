import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {Challenge} from '../interfaces/challenge';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private apiUrl: string = environment.apiUrl
  constructor(private http: HttpClient, private router: Router) { }

  getChallenges(): Observable<Challenge[]>{
    return this.http.get<Challenge[]>(this.apiUrl+'/challenge');
  }
}
