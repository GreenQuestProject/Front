import { TestBed } from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import { GamificationService } from './gamification.service';
import { environment } from '../../environments/environment';
import { GamificationProfile, LeaderboardResponse } from '../interfaces/analytics';
import {provideHttpClient} from '@angular/common/http';

describe('GamificationService', () => {
  let service: GamificationService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl + '/gamification';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GamificationService, provideHttpClient(),
        provideHttpClientTesting()],
    });
    service = TestBed.inject(GamificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProfile() should call GET /profile', () => {
    const mockProfile: GamificationProfile = {
      level: 5,
      xpTotal: 200,
      currentStreakDays: 3,
      completedCount: 12,
      impact: { co2Kg: 4.5, waterL: 100, wasteKg: 2.1 },
      badges: [],
    };

    service.getProfile().subscribe(res => {
      expect(res).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${baseUrl}/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('getLeaderboard() should call GET /leaderboard', () => {
    const mockLeaderboard: LeaderboardResponse = {
      items: [
        { username: 'alice', xp_total: 1000 } as any,
        { username: 'bob', xp_total: 800 } as any,
      ],
    };

    service.getLeaderboard().subscribe(res => {
      expect(res).toEqual(mockLeaderboard);
    });

    const req = httpMock.expectOne(`${baseUrl}/leaderboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLeaderboard);
  });

  it('claimWeeklyQuest() should POST /claim avec le code', () => {
    const mockResp = { status: 'ok', xp_credited: 50 };
    const code = '2025-W10';

    service.claimWeeklyQuest(code).subscribe(res => {
      expect(res).toEqual(mockResp);
    });

    const req = httpMock.expectOne(`${baseUrl}/claim`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ type: 'quest', code });
    req.flush(mockResp);
  });
});
