import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { AnalyticsComponent } from './analytics.component';
import { GamificationService } from '../services/gamification.service';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';

import { GamificationProfile, LeaderboardItem, OverviewResponse } from '../interfaces/analytics';

describe('AnalyticsComponent (DOM + logic)', () => {
  let fixture: any;
  let component: AnalyticsComponent;
  let element: HTMLElement;

  let gamificationSpy: jasmine.SpyObj<GamificationService>;
  let analyticsSpy: jasmine.SpyObj<AnalyticsService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const PROFILE_FIXTURE: GamificationProfile = {
    level: 7,
    xpTotal: 12345,
    currentStreakDays: 9,
    completedCount: 42,
    impact: { co2Kg: 12.34, waterL: 5678, wasteKg: 3.2 },
    badges: [
      { name: 'Eco Starter', rarity: 'common', unlockedAt: new Date('2025-01-10').toISOString() } as any,
      { name: 'Water Saver', rarity: 'rare', unlockedAt: new Date('2025-02-01').toISOString() } as any,
    ],
  };

  const LEADERBOARD_FIXTURE: LeaderboardItem[] = [
    { username: 'alice', xp_total: 15000 } as any,
    { username: 'me',    xp_total: 12345 } as any, // ← “me” pour tester userRank
    { username: 'bob',   xp_total: 9000 }  as any,
  ];

  const OVERVIEW_FIXTURE: OverviewResponse = {
    weekly: [
      { x: '2025-W30', y: 10 },
      { x: '2025-W31', y: 12 },
      { x: '2025-W32', y: 15 },
    ],
  } as any;

  beforeEach(async () => {
    gamificationSpy = jasmine.createSpyObj<GamificationService>('GamificationService', [
      'getProfile',
      'getLeaderboard',
    ]);
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'getOverviewPublic',
    ]);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']); // pour la NavBar

    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent], // composant standalone
      providers: [
        { provide: GamificationService, useValue: gamificationSpy },
        { provide: AnalyticsService, useValue: analyticsSpy },
        { provide: AuthService, useValue: authSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
  });

  const render = () => fixture.detectChanges();

  const spinner = () => element.querySelector('mat-spinner');
  const kpiCards = () => element.querySelectorAll('.kpi-grid mat-card');
  const impactCards = () => element.querySelectorAll('.impact-grid mat-card');
  const badgesListItems = () => element.querySelectorAll('.badges li');
  const leaderboardRows = () => element.querySelectorAll('tbody tr');
  const chartCanvas = () => element.querySelector('canvas');

  it('devrait créer le composant', () => {
    gamificationSpy.getProfile.and.returnValue(of(PROFILE_FIXTURE));
    gamificationSpy.getLeaderboard.and.returnValue(of({ items: LEADERBOARD_FIXTURE } as any));
    analyticsSpy.getOverviewPublic.and.returnValue(of(OVERVIEW_FIXTURE));

    render();
    expect(component).toBeTruthy();
  });

  it('ngOnInit: charge profil + leaderboard + overview, construit le graph, cache le spinner (DOM vérifié)', () => {
    gamificationSpy.getProfile.and.returnValue(of(PROFILE_FIXTURE));
    gamificationSpy.getLeaderboard.and.returnValue(of({ items: LEADERBOARD_FIXTURE } as any));
    analyticsSpy.getOverviewPublic.and.returnValue(of(OVERVIEW_FIXTURE));

    render();

    // Signals
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
    expect(component.profile()).toEqual(PROFILE_FIXTURE);
    expect(component.leaderboard()).toEqual(LEADERBOARD_FIXTURE);
    expect(component.overview()).toEqual(OVERVIEW_FIXTURE);

    // chart data construite
    expect(component.lineData.labels).toEqual(OVERVIEW_FIXTURE.weekly.map(w => w.x));
    const ds = component.lineData.datasets?.[0] as any;
    expect(ds.label).toContain('Communauté — défis terminés');
    expect(ds.data).toEqual(OVERVIEW_FIXTURE.weekly.map(w => w.y));

    // DOM
    expect(spinner()).toBeNull();          // plus de spinner
    expect(kpiCards().length).toBe(4);     // 4 KPIs
    expect(impactCards().length).toBe(4);  // 4 impact cards
    expect(badgesListItems().length).toBe(PROFILE_FIXTURE.badges.length);
    expect(leaderboardRows().length).toBe(LEADERBOARD_FIXTURE.length);
    expect(chartCanvas()).not.toBeNull();  // canvas présent
  });

  it('computed userRank: renvoie le rang de "me" dans le leaderboard', () => {
    gamificationSpy.getProfile.and.returnValue(of(PROFILE_FIXTURE)); // profile non-null requis
    gamificationSpy.getLeaderboard.and.returnValue(of({ items: LEADERBOARD_FIXTURE } as any));
    analyticsSpy.getOverviewPublic.and.returnValue(of(OVERVIEW_FIXTURE));

    render();

    // “me” est en index 1 → rang 2
    expect(component.userRank()).toBe(2);
  });

  it('état avec leaderboard vide: tableau vide (DOM)', () => {
    gamificationSpy.getProfile.and.returnValue(of(PROFILE_FIXTURE));
    gamificationSpy.getLeaderboard.and.returnValue(of({ items: [] } as any));
    analyticsSpy.getOverviewPublic.and.returnValue(of(OVERVIEW_FIXTURE));

    render();

    expect(component.leaderboard().length).toBe(0);
    expect(leaderboardRows().length).toBe(0);
  });

  it('gestion erreur: set error message; loading reste true (complete non appelé) → spinner visible', () => {
    // forkJoin émettra une erreur → complete() ne se déclenche pas
    gamificationSpy.getProfile.and.returnValue(throwError(() => ({ error: { message: 'Oops' } })));
    gamificationSpy.getLeaderboard.and.returnValue(of({ items: [] } as any));
    analyticsSpy.getOverviewPublic.and.returnValue(of(OVERVIEW_FIXTURE));

    render();

    expect(component.error()).toBe('Oops');
    // Dans ce composant, loading est remis à false SEULEMENT dans complete()
    // donc après erreur, il reste true.
    expect(component.loading()).toBeTrue();
    expect(spinner()).not.toBeNull();
  });

  it('chargement progressif (pending) : spinner visible puis masqué après next+complete', () => {
    const pendingProfile$ = new Subject<GamificationProfile>();
    const pendingLb$ = new Subject<{ items: LeaderboardItem[] }>();
    const pendingOverview$ = new Subject<OverviewResponse>();

    gamificationSpy.getProfile.and.returnValue(pendingProfile$.asObservable());
    gamificationSpy.getLeaderboard.and.returnValue(pendingLb$.asObservable());
    analyticsSpy.getOverviewPublic.and.returnValue(pendingOverview$.asObservable());

    render(); // lance ngOnInit → loading=true
    expect(component.loading()).toBeTrue();
    expect(spinner()).not.toBeNull();

    // On émet les valeurs
    pendingProfile$.next(PROFILE_FIXTURE);
    pendingLb$.next({ items: LEADERBOARD_FIXTURE });
    pendingOverview$.next(OVERVIEW_FIXTURE);

    // On complète les streams → forkJoin.complete() est appelé → loading false
    pendingProfile$.complete();
    pendingLb$.complete();
    pendingOverview$.complete();
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(spinner()).toBeNull();
  });
});
