import { TestBed } from '@angular/core/testing';
import { ChallengeListComponent } from './challenge-list.component';
import { ChallengeService } from '../services/challenge.service';
import { ProgressionService } from '../services/progression.service';
import { AuthService } from '../services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Challenge } from '../interfaces/challenge';

describe('ChallengeListComponent (DOM + logic)', () => {
  let fixture: any;
  let component: ChallengeListComponent;
  let element: HTMLElement;

  let challengeSpy: jasmine.SpyObj<ChallengeService>;
  let progressionSpy: jasmine.SpyObj<ProgressionService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let consoleErrorSpy: jasmine.Spy;

  const CHALLENGES_FIXTURE: Challenge[] = [
    { id: 1, name: 'Défi A', category: 'ecology', description: 'A...', isInUserProgression: false } as Challenge,
    { id: 2, name: 'Défi B', category: 'health',  description: 'B...', isInUserProgression: false } as Challenge,
    { id: 3, name: 'Défi C', category: 'health',  description: 'C...', isInUserProgression: true  } as Challenge,
  ];

  beforeEach(async () => {
    challengeSpy = jasmine.createSpyObj<ChallengeService>('ChallengeService', ['getChallenges']);
    progressionSpy = jasmine.createSpyObj<ProgressionService>('ProgressionService', ['startChallenge']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [ChallengeListComponent], // standalone component
      providers: [
        { provide: ChallengeService, useValue: challengeSpy },
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy }, // pour NavBarComponent
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChallengeListComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    consoleErrorSpy = spyOn(console, 'error').and.stub();
  });

  const render = () => fixture.detectChanges();

  const cards = () => element.querySelectorAll('mat-card');
  const startButtons = () => element.querySelectorAll('button[title="Commencer le défi"]');

  it('devrait créer le composant', () => {
    challengeSpy.getChallenges.and.returnValue(of([]));
    render();
    expect(component).toBeTruthy();
  });

  it('ngOnInit: charge défis, initialise catégories et message (DOM vérifié)', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    expect(component.challenges).toEqual(CHALLENGES_FIXTURE);
    expect(component.categories.sort()).toEqual(['ecology', 'health'].sort());
    expect(component.selectedCategories.sort()).toEqual(['ecology', 'health'].sort());
    expect(component.notFoundMessage).toBe('Aucun défi trouvé.');

    // DOM
    expect(cards().length).toBe(3);
    const names = Array.from(element.querySelectorAll('mat-card h1')).map(h => h.textContent?.trim());
    expect(names).toEqual(['Défi A', 'Défi B', 'Défi C']);
  });

  it('ngOnInit: 401 → redirige /login et log', () => {
    challengeSpy.getChallenges.and.returnValue(throwError(() => ({ status: 401 })));
    render();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('DOM: bouton "Commencer" désactivé si isInUserProgression=true et tooltip différent', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    const btns = startButtons();
    expect(btns.length).toBe(3);

    // index 2 (id:3) est déjà dans la progression → disabled
    expect((btns[0] as HTMLButtonElement).disabled).toBeFalse();
    expect((btns[1] as HTMLButtonElement).disabled).toBeFalse();
    expect((btns[2] as HTMLButtonElement).disabled).toBeTrue();

    // attribut matTooltip rendu dans le DOM (ng-reflect)
    const tooltip3 = (btns[2] as HTMLElement).getAttribute('ng-reflect-message') ||
                     (btns[2] as HTMLElement).getAttribute('ng-reflect-mat-tooltip') || '';

    expect(tooltip3).toContain('Déjà commencé');
  });

  it('start(): succès → met à jour localement (DOM mis à jour)', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    progressionSpy.startChallenge.and.returnValue(of({ ok: true }));
    render();

    component.start(1);
    fixture.detectChanges();

    expect(progressionSpy.startChallenge).toHaveBeenCalledWith(1);
    const updated = component.challenges.find(c => c.id === 1);
    expect(updated?.isInUserProgression).toBeTrue();

    const btn = startButtons()[0] as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();
  });

  it('start(): erreur → log console, pas de MAJ locale', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    progressionSpy.startChallenge.and.returnValue(throwError(() => new Error('boom')));
    render();

    const before = component.challenges.map(c => ({ ...c }));
    component.start(1);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.challenges).toEqual(before);
  });

  it('onCategorySelectionChange(): si aucune catégorie → challenges=[] (DOM: notFound)', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    component.selectedCategories = [];
    component.onCategorySelectionChange();
    fixture.detectChanges();

    expect(component.challenges).toEqual([]);
    expect((element.textContent || '').includes('Aucun défi trouvé')).toBeTrue();
  });

  it('onCategorySelectionChange(): filtre et remplit challenges, isLoading true → false', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    const pending$ = new Subject<Challenge[]>();
    challengeSpy.getChallenges.and.returnValue(pending$.asObservable());

    component.selectedCategories = ['ecology'];
    component.onCategorySelectionChange();
    expect(component.isLoading).toBeTrue();

    pending$.next(CHALLENGES_FIXTURE.filter(c => c.category === 'ecology'));
    pending$.complete();
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.challenges.length).toBe(1);
    expect(cards().length).toBe(1);
  });

  it('onCategorySelectionChange(): erreur → log console, isLoading repasse à false', () => {
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    challengeSpy.getChallenges.and.returnValue(throwError(() => new Error('network')));
    component.selectedCategories = ['ecology'];
    component.onCategorySelectionChange();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });
});
