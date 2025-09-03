import {renderStandalone} from '../../testing/test-helpers';
import {ReminderDialogComponent} from './reminder-dialog.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

describe('ReminderDialogComponent', () => {
  let refSpy: jasmine.SpyObj<MatDialogRef<ReminderDialogComponent>>;

  beforeEach(() => {
    refSpy = jasmine.createSpyObj<MatDialogRef<ReminderDialogComponent>>('MatDialogRef', ['close']);
  });

  it('devrait créer le composant', async () => {
    const {instance} = await renderStandalone(ReminderDialogComponent, {
      providers: [
        {provide: MatDialogRef, useValue: refSpy},
        {provide: MAT_DIALOG_DATA, useValue: {progressionId: 42}},
      ],
    });

    expect(instance).toBeTruthy();
  });

  it('état initial: when="", recurrence="NONE", bouton Planifier désactivé', async () => {
    const {instance, element} = await renderStandalone(ReminderDialogComponent, {
      providers: [
        {provide: MatDialogRef, useValue: refSpy},
        {provide: MAT_DIALOG_DATA, useValue: {progressionId: 42}},
      ],
    });

    expect(instance.when).toBe('');
    expect(instance.recurrence).toBe('NONE');

    const planifierBtn = Array.from(element.querySelectorAll('button'))
      .find(b => (b.textContent || '').includes('Planifier')) as HTMLButtonElement;

    expect(planifierBtn).withContext('Le bouton Planifier devrait exister').toBeTruthy();
    expect(planifierBtn.disabled).toBeTrue();
  });

  it('click "Annuler": appelle ref.close() sans payload', async () => {
    const {element} = await renderStandalone(ReminderDialogComponent, {
      providers: [
        {provide: MatDialogRef, useValue: refSpy},
        {provide: MAT_DIALOG_DATA, useValue: {progressionId: 42}},
      ],
    });

    const annulerBtn = Array.from(element.querySelectorAll('button'))
      .find(b => (b.textContent || '').includes('Annuler')) as HTMLButtonElement;

    annulerBtn.click();

    expect(refSpy.close).toHaveBeenCalledWith();
  });

  it('click "Planifier": envoie { when, recurrence } et ferme le dialog', async () => {
    const {instance, element, fixture} = await renderStandalone(ReminderDialogComponent, {
      providers: [
        {provide: MatDialogRef, useValue: refSpy},
        {provide: MAT_DIALOG_DATA, useValue: {progressionId: 42}},
      ],
    });

    instance.when = '2025-08-28T10:00';
    instance.recurrence = 'WEEKLY' as any;
    fixture.detectChanges();

    const planifierBtn = Array.from(element.querySelectorAll('button'))
      .find(b => (b.textContent || '').includes('Planifier')) as HTMLButtonElement;

    expect(planifierBtn.disabled).toBeFalse();

    planifierBtn.click();

    expect(refSpy.close).toHaveBeenCalledWith({
      when: '2025-08-28T10:00',
      recurrence: 'WEEKLY',
    });
  });

  it('méthodes publiques: close() et save() appellent MatDialogRef.close(...) correctement', async () => {
    const {instance} = await renderStandalone(ReminderDialogComponent, {
      providers: [
        {provide: MatDialogRef, useValue: refSpy},
        {provide: MAT_DIALOG_DATA, useValue: {progressionId: 42}},
      ],
    });

    instance.close();
    expect(refSpy.close).toHaveBeenCalledWith();

    (refSpy.close as jasmine.Spy).calls.reset();
    instance.when = '2025-12-31T23:59';
    instance.recurrence = 'DAILY' as any;
    instance.save();

    expect(refSpy.close).toHaveBeenCalledWith({
      when: '2025-12-31T23:59',
      recurrence: 'DAILY',
    });
  });
});
