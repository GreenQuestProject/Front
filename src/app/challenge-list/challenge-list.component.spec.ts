import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChallengeListComponent } from './challenge-list.component';
import { ChallengeService } from '../services/challenge.service';
import { ProgressionService } from '../services/progression.service';
import { AuthService } from '../services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Challenge } from '../interfaces/challenge';
import { MatDialog } from '@angular/material/dialog';

describe('ChallengeListComponent (DOM + logic)', () => {
  let fixture: any;
  let component: ChallengeListComponent;
  let element: HTMLElement;

  let challengeSpy: jasmine.SpyObj<ChallengeService>;
  let progressionSpy: jasmine.SpyObj<ProgressionService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let consoleErrorSpy: jasmine.Spy;

  let dialogOpenSpy: jasmine.Spy<(comp: any, config?: any) => any>;
  let currentDialogResult: any = undefined;
  let lastDialogConfig: any = undefined;

  const CHALLENGES_FIXTURE: Challenge[] = [
    { id: 1, name: 'Défi A', category: 'ecology', description: 'A...', isInUserProgression: false } as Challenge,
    { id: 2, name: 'Défi B', category: 'health',  description: 'B...', isInUserProgression: false } as Challenge,
    { id: 3, name: 'Défi C', category: 'health',  description: 'C...', isInUserProgression: true  } as Challenge,
  ];

  beforeEach(async () => {
    challengeSpy = jasmine.createSpyObj<ChallengeService>(
      'ChallengeService',
      ['getChallenges', 'getChallengeCategories', 'getChallenge']
    );
    progressionSpy = jasmine.createSpyObj<ProgressionService>('ProgressionService', ['startChallenge']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [ChallengeListComponent], // standalone component
      providers: [
        { provide: ChallengeService, useValue: challengeSpy },
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    dialogOpenSpy = spyOn(MatDialog.prototype, 'open').and.callFake((_comp: any, config?: any) => {
      lastDialogConfig = config;
      return { afterClosed: () => of(currentDialogResult) } as any;
    });

    fixture = TestBed.createComponent(ChallengeListComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    consoleErrorSpy = spyOn(console, 'error').and.stub();
  });

  const render = () => fixture.detectChanges();

  const cards = () => element.querySelectorAll('mat-card');
  const detailsButtons = () => Array.from(element.querySelectorAll('button'))
    .filter(b => (b.textContent || '').trim() === 'Voir détails') as HTMLButtonElement[];

  it('devrait créer le composant', () => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of([]));
    render();
    expect(component).toBeTruthy();
  });

  it('ngOnInit: charge défis, initialise catégories et message (DOM vérifié)', () => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    expect(component.challenges).toEqual(CHALLENGES_FIXTURE);
    expect(component.categories.map(c => c.value).sort()).toEqual(['ecology', 'health'].sort());
    expect(component.selectedCategories.sort()).toEqual(['ecology', 'health'].sort());
    expect(component.notFoundMessage).toBe('Aucun défi trouvé.');

    // DOM
    expect(cards().length).toBe(3);
    const names = Array.from(element.querySelectorAll('mat-card h1')).map(h => h.textContent?.trim());
    expect(names).toEqual(['Défi A', 'Défi B', 'Défi C']);

    expect(detailsButtons().length).toBe(3);
    const startBtnsInList = element.querySelectorAll('button[title="Commencer le défi"]');
    expect(startBtnsInList.length).toBe(0);
  });

  it('ngOnInit: 401 → redirige /login et log', () => {
    challengeSpy.getChallengeCategories.and.returnValue(throwError(() => ({ status: 401 })));
    render();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('start(): succès → met à jour localement (DOM mis à jour)', () => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    progressionSpy.startChallenge.and.returnValue(of({ ok: true }));
    render();

    component.start(1);
    fixture.detectChanges();

    expect(progressionSpy.startChallenge).toHaveBeenCalledWith(1);
    const updated = component.challenges.find(c => c.id === 1);
    expect(updated?.isInUserProgression).toBeTrue();
  });

  it('start(): erreur → log console, pas de MAJ locale', () => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    progressionSpy.startChallenge.and.returnValue(throwError(() => new Error('boom')));
    render();

    const before = component.challenges.map(c => ({ ...c }));
    component.start(1);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.challenges).toEqual(before);
  });

  it('onCategorySelectionChange(): si aucune catégorie → challenges=[] (DOM: notFound)', () => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    component.selectedCategories = [];
    component.onCategorySelectionChange();
    fixture.detectChanges();

    expect(component.challenges).toEqual([]);
    expect((element.textContent || '').includes('Aucun défi trouvé')).toBeTrue();
  });

  it('onCategorySelectionChange(): filtre et remplit challenges, isLoading true → false', () => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
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
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    render();

    challengeSpy.getChallenges.and.returnValue(throwError(() => new Error('network')));
    component.selectedCategories = ['ecology'];
    component.onCategorySelectionChange();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('openDetails(): récupère le détail, ouvre le dialog, et MAJ la liste si "started"', fakeAsync(() => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    fixture.detectChanges();

    challengeSpy.getChallenge.and.returnValue(of({
      id: 1, name: 'Défi A', category: 'ecology', description: 'A...', isInUserProgression: false
    } as Challenge));

    currentDialogResult = { action: 'started', id: 1 };

    component.openDetails(1);
    tick();
    fixture.detectChanges();

    expect(dialogOpenSpy).toHaveBeenCalled();
    const updated = component.challenges.find(c => c.id === 1);
    expect(updated?.isInUserProgression).toBeTrue();
  }));

  it('openDetails(): merge isInUserProgression depuis la liste dans les data du dialog', fakeAsync(() => {
    challengeSpy.getChallengeCategories.and.returnValue(of([
      { name: 'ECOLOGY', value: 'ecology' },
      { name: 'HEALTH',  value: 'health' }
    ]));
    challengeSpy.getChallenges.and.returnValue(of(CHALLENGES_FIXTURE));
    fixture.detectChanges();

    challengeSpy.getChallenge.and.returnValue(of({
      id: 3, name: 'Défi C (full)', category: 'health', description: 'C full', isInUserProgression: false
    } as Challenge));

    currentDialogResult = undefined;

    component.openDetails(3);
    tick();
    fixture.detectChanges();

    const cfg = lastDialogConfig as { data: Challenge };
    expect(cfg.data.id).toBe(3);
    expect(cfg.data.isInUserProgression).toBeTrue(); // merge depuis la liste
  }));
});
