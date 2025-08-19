import { ProgressionListComponent } from './progression-list.component';
import { ProgressionService } from '../services/progression.service';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import {
  PROGRESSIONS_FIXTURE,
  cloneProgressions,
  stubGetProgressionsSeq,
  makePending,
  TEXTS,
} from '../../testing/progression-helpers';
import { renderStandalone } from '../../testing/test-helpers';
import { Progression } from '../interfaces/progression';
import {ChallengeService} from '../services/challenge.service';



describe('ProgressionListComponent', () => {
  const CATEGORIES_FIXTURE = [
    { name: 'ECOLOGY', value: 'ecology' },
    { name: 'HEALTH',  value: 'health'  },
  ];

  const STATUSES_FIXTURE = [
    { name: 'PENDING',     value: 'pending'     },
    { name: 'IN_PROGRESS', value: 'in_progress' },
    { name: 'FAILED',      value: 'failed'      },
  ];

  let progressionSpy: jasmine.SpyObj<ProgressionService>;
  let challengeSpy: jasmine.SpyObj<ChallengeService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    challengeSpy = jasmine.createSpyObj<ChallengeService>('ChallengeService', [
      'getChallengeCategories',
      'getChallengeStatus',
    ]);

    challengeSpy.getChallengeCategories.and.returnValue(of(CATEGORIES_FIXTURE));
    challengeSpy.getChallengeStatus.and.returnValue(of(STATUSES_FIXTURE));

    progressionSpy = jasmine.createSpyObj<ProgressionService>('ProgressionService', [
      'getProgressions',
      'updateStatus',
    ]);
    // Stub par défaut (sécurité)
    progressionSpy.getProgressions.and.returnValue(of([]));

    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUser',
      'isLoggedIn',
      'isAdmin',
      'logout',
      'initializeAuth',
    ]);
    authSpy.getCurrentUser.and.returnValue(of(null));
    authSpy.isLoggedIn.and.returnValue(of(false));
    authSpy.isAdmin.and.returnValue(of(false));
    authSpy.initializeAuth.and.returnValue(of(null));
  });

  it('devrait créer le composant', async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);
    const filtered = initial.filter(p => p.status !== 'failed');

    const { instance } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(filtered));
      },
    });

    expect(instance).toBeTruthy();
  });

  it('ngOnInit: charge données, initialise filtres, puis applyFilters recharge la liste (DOM vérifié)', async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);
    const filtered = initial.filter(p => p.status !== 'failed');

    const { instance, element } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(filtered));
      },
    });

    expect(instance.categories.map(c => c.value).sort()).toEqual(['ecology', 'health'].sort());
    expect(instance.selectedCategories.sort()).toEqual(['ecology', 'health'].sort());
    expect(instance.status.map(s => s.value).sort()).toEqual(['pending', 'in_progress', 'failed'].sort());
    expect(instance.selectedStatus.sort()).toEqual(['pending', 'in_progress'].sort());
    expect(instance.progressions).toEqual(filtered);

    const cards = element.querySelectorAll('mat-card');
    expect(cards.length).toBe(filtered.length);

    expect(instance.notFoundMessage).toBe(TEXTS.notFound);
  });

  it('applyFilters: si filtres vides → progressions=[], message not found', async () => {
    const { instance } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of([]), of([]));
      },
    });

    instance.selectedCategories = [];
    instance.selectedStatus = ['pending'];
    instance.applyFilters();
    expect(instance.progressions).toEqual([]);
    expect(instance.notFoundMessage).toBe(TEXTS.notFound);

    instance.selectedCategories = ['ecology'];
    instance.selectedStatus = [];
    instance.applyFilters();
    expect(instance.progressions).toEqual([]);
    expect(instance.notFoundMessage).toBe(TEXTS.notFound);
  });

  it('applyFilters: isLoading passe à true le temps de la requête puis à false', async () => {
    const { instance } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of([]), of([]));
      },
    });

    const pending = makePending<Progression[]>();
    (progressionSpy.getProgressions as any).calls.reset();
    (progressionSpy.getProgressions as any).and.returnValue(pending.$);

    instance.selectedCategories = ['ecology'];
    instance.selectedStatus = ['pending'];
    instance.applyFilters();

    expect(instance.isLoading).toBeTrue();

    pending.next([{ id: 99, name: 'X', category: 'ecology', status: 'pending', description: '' } as Progression]);
    pending.complete();

    expect(instance.isLoading).toBeFalse();
    expect(instance.progressions.length).toBe(1);
  });

  it('validate(): updateStatus("completed"), met à jour localement + refreshFilters refait un fetch', async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);

    const { instance } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(initial));
      },
    });

    progressionSpy.updateStatus.and.returnValue(of({ updated: true }));

    const afterValidate = initial.map(p => p.id === 1 ? { ...p, status: 'completed' } : p);
    (progressionSpy.getProgressions as any).and.returnValue(of(afterValidate));

    instance.validate(1);

    expect(progressionSpy.updateStatus).toHaveBeenCalledWith(1, 'completed');
    expect(instance.progressions.find(p => p.id === 1)?.status).toBe('completed');
    expect(progressionSpy.getProgressions).toHaveBeenCalled();
    expect(instance.progressions).toEqual(afterValidate);
  });

  it('remove(): updateStatus("failed"), met à jour localement + refreshFilters refait un fetch', async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);

    const { instance } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(initial));
      },
    });

    progressionSpy.updateStatus.and.returnValue(of({ updated: true }));

    const afterRemove = initial.map(p => p.id === 1 ? { ...p, status: 'failed' } : p);
    (progressionSpy.getProgressions as any).and.returnValue(of(afterRemove));

    instance.remove(1);

    expect(progressionSpy.updateStatus).toHaveBeenCalledWith(1, 'failed');
    expect(instance.progressions.find(p => p.id === 1)?.status).toBe('failed');
    expect(progressionSpy.getProgressions).toHaveBeenCalled();
    expect(instance.progressions).toEqual(afterRemove);
  });

  it('ngOnInit: 401 → redirige /login et log l’erreur', async () => {
    const { navigateByUrlSpy, consoleErrorSpy } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        (progressionSpy.getProgressions as any).calls.reset();
        (progressionSpy.getProgressions as any).and.returnValue(
          throwError(() => ({ status: 401, message: 'Unauthorized' }))
        );
      },
    });

    expect(navigateByUrlSpy).toHaveBeenCalledOnceWith('/login');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('getStatusColor: renvoie les bonnes couleurs (sans ngOnInit)', async () => {
    const { instance } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {/* rien: on ne déclenche pas de logique réseau ici */},
    });

    expect(instance.getStatusColor('pending')).toBe('#FFA500');
    expect(instance.getStatusColor('in_progress')).toBe('#007BFF');
    expect(instance.getStatusColor('completed')).toBe('#28A745');
    expect(instance.getStatusColor('failed')).toBe('#DC3545');
    expect(instance.getStatusColor('unknown')).toBe('#6C757D');
  });

  it('DOM: affiche le message notFound quand aucune progression', async () => {
    const { instance, fixture, element } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of([]), of([]));
      },
    });

    instance.selectedCategories = [];
    instance.selectedStatus = [];
    instance.applyFilters();
    fixture.detectChanges();

    const text = (element.textContent || '').trim();
    expect(text).toContain('Aucune progression trouvée');
  });


  it("applyFilters: en cas d'erreur, log l'erreur et repasse isLoading à false", async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);

    const { instance, consoleErrorSpy } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        // ngOnInit (1er fetch) + applyFilters initial (2e fetch) → on s'en fiche du contenu
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(initial));
      },
    });

    // Filtres non vides pour déclencher l'appel
    instance.selectedCategories = ['ecology'];
    instance.selectedStatus = ['pending'];

    // Prochain getProgressions() → erreur
    (progressionSpy.getProgressions as any).calls.reset();
    (progressionSpy.getProgressions as any).and.returnValue(
      throwError(() => new Error('network down'))
    );

    instance.applyFilters();

    expect(instance.isLoading).toBeFalse();         // remis à false dans le bloc error
    expect(consoleErrorSpy).toHaveBeenCalled();     // console.error(error)
  });

  it("validate(): en cas d'erreur sur updateStatus, log l'erreur et ne modifie pas la liste", async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);

    const { instance, consoleErrorSpy } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        // ngOnInit + applyFilters initial pour avoir des données
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(initial));
      },
    });

    const snapshot = instance.progressions.map(p => ({ ...p }));
    progressionSpy.updateStatus.and.returnValue(throwError(() => new Error('update failed')));

    instance.validate(initial[0].id!);

    expect(consoleErrorSpy).toHaveBeenCalled();
    // pas de changement local si erreur
    expect(instance.progressions).toEqual(snapshot);
  });

  it("remove(): en cas d'erreur sur updateStatus, log l'erreur et ne modifie pas la liste", async () => {
    const initial = cloneProgressions(PROGRESSIONS_FIXTURE);

    const { instance, consoleErrorSpy } = await renderStandalone(ProgressionListComponent, {
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ChallengeService,   useValue: challengeSpy }
      ],
      beforeDetectChanges: () => {
        stubGetProgressionsSeq(progressionSpy.getProgressions as any, of(initial), of(initial));
      },
    });

    const snapshot = instance.progressions.map(p => ({ ...p }));
    progressionSpy.updateStatus.and.returnValue(throwError(() => new Error('update failed')));

    instance.remove(initial[0].id!);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(instance.progressions).toEqual(snapshot);
  });
});
