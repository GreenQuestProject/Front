import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GamificationProfile, LeaderboardResponse } from '../interfaces/analytics';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private http = inject(HttpClient);
  private apiUrl: string = environment.apiUrl+'/gamification';
  getProfile(): Observable<GamificationProfile> {
    return this.http.get<GamificationProfile>(`${this.apiUrl}/profile`);
  }

  getLeaderboard(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/leaderboard`);
  }

  claimWeeklyQuest(weekCode: string) {
    return this.http.post<{ status: string; xp_credited?: number; need?: number; have?: number; rule?: string; error?: string }>(
      `${this.apiUrl}/claim`,
      { type: 'quest', code: weekCode }
    );
  }
}
