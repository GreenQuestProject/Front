import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('PwaUpdateService', () => {
  let versionUpdates$: Subject<VersionEvent>;
  let swUpdateMock: {
    isEnabled: boolean;
    versionUpdates: any;
    checkForUpdate: jasmine.Spy<() => Promise<boolean>>;
    activateUpdate: jasmine.Spy<() => Promise<void>>;
  };
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  let setIntervalSpy: jasmine.Spy;
  let intervalHandler: Function | null;

  function setup(isEnabled: boolean) {
    versionUpdates$ = new Subject<VersionEvent>();
    swUpdateMock = {
      isEnabled,
      versionUpdates: versionUpdates$.asObservable(),
      checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(true),
      activateUpdate: jasmine.createSpy('activateUpdate').and.resolveTo(),
    };

    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    intervalHandler = null;
    setIntervalSpy = spyOn((window as any), 'setInterval').and.callFake(((handler: TimerHandler, timeout?: number) => {
      intervalHandler = handler as any;
      return 123 as any;
    }) as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    return TestBed.inject(PwaUpdateService);
  }

  afterEach(() => {
    if (versionUpdates$) versionUpdates$.complete();
  });

  it('isEnabled=false : ne planifie rien et n’ouvre pas de snackbar', () => {
    setup(false);

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();

    versionUpdates$.next({ type: 'VERSION_READY' } as any);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('isEnabled=true : planifie checkForUpdate() horaire et ouvre un snackbar sur VERSION_READY (sans recharger la page)', async () => {
    const service = setup(true);

    // 1h
    expect(setIntervalSpy).toHaveBeenCalled();
    const [, delay] = setIntervalSpy.calls.mostRecent().args;
    expect(delay).toBe(60 * 60 * 1000);

    // tick → checkForUpdate()
    expect(swUpdateMock.checkForUpdate).not.toHaveBeenCalled();
    (intervalHandler as Function)();
    expect(swUpdateMock.checkForUpdate).toHaveBeenCalled();

    // snackbar ref factice
    const onAction$ = new Subject<void>();
    snackBarSpy.open.and.returnValue({ onAction: () => onAction$.asObservable() } as any);

    // event prêt
    versionUpdates$.next({ type: 'VERSION_READY', currentVersion: {} as any, latestVersion: {} as any });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Une nouvelle version est disponible',
      'Mettre à jour',
      { duration: 10000 }
    );

    const aarSpy = spyOn<any>(service as any, 'activateAndReload').and.stub();

    // clic utilisateur
    onAction$.next();
    onAction$.complete();
    await Promise.resolve(); // micro-task

    expect(aarSpy).toHaveBeenCalled();        // le clic déclenche bien le flux de mise à jour
    // on n’assert PAS reload() ici pour éviter tout souci d’environnement
  });

  it('ignore les événements ≠ VERSION_READY', () => {
    setup(true);

    snackBarSpy.open.calls.reset();
    versionUpdates$.next({ type: 'VERSION_DETECTED', version: {} as any } as any);

    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });
});
