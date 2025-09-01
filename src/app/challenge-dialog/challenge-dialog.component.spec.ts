import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChallengeDialogComponent } from './challenge-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { Challenge } from '../interfaces/challenge';
import { ProgressionService } from '../services/progression.service';

describe('ChallengeDialogComponent (DOM + logic)', () => {
  let fixture: any;
  let component: ChallengeDialogComponent;
  let element: HTMLElement;

  let progressionSpy: jasmine.SpyObj<ProgressionService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ChallengeDialogComponent>>;
  let consoleErrorSpy: jasmine.Spy;

  const BASE_DATA: Challenge = {
    id: 42,
    name: 'Défi Test',
    category: 'ecology',
    description: 'Desc',
    isInUserProgression: false,
    basePoints: 100 as any,
    difficulty: 3 as any,
    isRepeatable: false as any,
    co2EstimateKg: undefined,
    waterEstimateL: undefined,
    wasteEstimateKg: undefined,
  } as any;

  beforeEach(async () => {
    progressionSpy = jasmine.createSpyObj<ProgressionService>('ProgressionService', ['startChallenge']);
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ChallengeDialogComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ChallengeDialogComponent],
      providers: [
        { provide: ProgressionService, useValue: progressionSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { ...BASE_DATA } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChallengeDialogComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    consoleErrorSpy = spyOn(console, 'error').and.stub();

    fixture.detectChanges();
  });

  const startButton = () =>
    Array.from(element.querySelectorAll('button'))
      .find(b => (b.getAttribute('title') || '') === 'Commencer le défi') as HTMLButtonElement;

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
    expect(component.data.name).toBe('Défi Test');
  });

  it('starLine(): borne entre 1 et 5 et arrondi', () => {
    expect(component.starLine(0)).toBe('★☆☆☆☆');       // borne basse
    expect(component.starLine(3.3)).toBe('★★★☆☆');     // arrondi
    expect(component.starLine(7)).toBe('★★★★★');       // borne haute
  });

  it('asNumber(): convertit string/number, undefined → 0', () => {
    expect(component.asNumber(undefined)).toBe(0);
    expect(component.asNumber('4')).toBe(4);
    expect(component.asNumber(5)).toBe(5);
  });

  it('hasImpacts(): true si au moins une estimation définie', () => {
    // aucun impact
    expect(component.hasImpacts()).toBeFalse();

    // un impact suffit
    component.data.co2EstimateKg = 1 as any;
    expect(component.hasImpacts()).toBeTrue();

    // reset et tester un autre
    component.data.co2EstimateKg = undefined as any;
    component.data.waterEstimateL = 10 as any;
    expect(component.hasImpacts()).toBeTrue();

    // reset et tester le dernier
    component.data.waterEstimateL = undefined as any;
    component.data.wasteEstimateKg = 0.5 as any;
    expect(component.hasImpacts()).toBeTrue();
  });

  it('close(): ferme le dialog', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('startFromDialog(): ne fait rien si pas d’id', () => {
    component.data.id = undefined as any;
    component.startFromDialog({ stopPropagation() {} } as any);

    expect(progressionSpy.startChallenge).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('startFromDialog(): ne fait rien si déjà en progression', () => {
    component.data.id = 99 as any;
    component.data.isInUserProgression = true as any;

    component.startFromDialog({ stopPropagation() {} } as any);

    expect(progressionSpy.startChallenge).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('startFromDialog(): succès → MAJ isInUserProgression, isStarting repasse false, et close avec payload', fakeAsync(() => {
    // Arrange
    component.data = { ...BASE_DATA, id: 7, isInUserProgression: false } as any;
    progressionSpy.startChallenge.and.returnValue(of({ ok: true } as any));

    fixture.detectChanges();
    expect(startButton().disabled).toBeFalse();

    // Act
    component.startFromDialog({ stopPropagation() {} } as any);

    // Pas d’attente sur l’état transitoire: of(...) est sync
    tick();
    fixture.detectChanges();

    // Assert finaux
    expect(progressionSpy.startChallenge).toHaveBeenCalledOnceWith(7);
    expect(component.data.isInUserProgression).toBeTrue();
    expect(component.isStarting).toBeFalse();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'started', id: 7 });

    // DOM: le bouton devient disabled
    expect(startButton().disabled).toBeTrue();
  }));

  it('startFromDialog(): erreur → log, isStarting repasse false, ne ferme pas', fakeAsync(() => {
    component.data = { ...BASE_DATA, id: 8, isInUserProgression: false } as any;
    progressionSpy.startChallenge.and.returnValue(throwError(() => new Error('boom')));

    component.startFromDialog({ stopPropagation() {} } as any);

    // Pas d’attente sur l’état transitoire
    tick();
    fixture.detectChanges();

    expect(progressionSpy.startChallenge).toHaveBeenCalledOnceWith(8);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.isStarting).toBeFalse();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();

    // DOM: bouton réactivé (pas en cours, pas commencé)
    expect(startButton().disabled).toBeFalse();
  }));

});
