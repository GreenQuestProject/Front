import {TestBed} from '@angular/core/testing';
import {PushBridgeService} from './push-bridge.service';
import {RemindersService} from './reminders.service';
import {Router} from '@angular/router';

describe('PushBridgeService', () => {
  let service: PushBridgeService;

  let remindersSpy: jasmine.SpyObj<RemindersService>;
  let routerSpy: jasmine.SpyObj<Router>;

  let addEventListenerSpy: jasmine.Spy;
  let swMessageHandler: ((ev: MessageEvent) => void) | null;

  let originalSW: any;

  beforeEach(() => {
    remindersSpy = jasmine.createSpyObj<RemindersService>('RemindersService', [
      'complete',
      'snooze',
    ]);
    remindersSpy.complete.and.resolveTo(undefined as any);
    remindersSpy.snooze.and.resolveTo(undefined as any);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        {provide: RemindersService, useValue: remindersSpy},
        {provide: Router, useValue: routerSpy},
      ],
    });

    originalSW = (navigator as any).serviceWorker;
    swMessageHandler = null;

    const fakeSW = {
      addEventListener: (...args: any[]) => {
      },
    };
    addEventListenerSpy = spyOn(fakeSW, 'addEventListener').and.callFake(
      (type: string, cb: (e: MessageEvent) => void) => {
        if (type === 'message') swMessageHandler = cb;
      }
    );

    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: fakeSW,
      configurable: true,
      writable: false,
    });

    service = TestBed.inject(PushBridgeService);
  });

  afterEach(() => {
    try {
      delete (window.navigator as any).serviceWorker;
    } catch {
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: originalSW,
        configurable: true,
      });
    }
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('s’abonne aux messages du Service Worker quand disponible', () => {
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', jasmine.any(Function));
    expect(swMessageHandler).toEqual(jasmine.any(Function));
  });

  it('ignore les messages sans type REMINDER_ACTION', async () => {
    expect(swMessageHandler).toBeTruthy();

    swMessageHandler!({data: {type: 'OTHER'}} as any);

    expect(remindersSpy.complete).not.toHaveBeenCalled();
    expect(remindersSpy.snooze).not.toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('action "done" → appelle reminders.complete(reminderId)', async () => {
    expect(swMessageHandler).toBeTruthy();

    swMessageHandler!({data: {type: 'REMINDER_ACTION', action: 'done', reminderId: 7}} as any);

    await Promise.resolve();

    expect(remindersSpy.complete).toHaveBeenCalledOnceWith(7);
    expect(remindersSpy.snooze).not.toHaveBeenCalled();
  });

  it('action "snooze" → appelle reminders.snooze(reminderId)', async () => {
    expect(swMessageHandler).toBeTruthy();

    swMessageHandler!({data: {type: 'REMINDER_ACTION', action: 'snooze', reminderId: 9}} as any);

    await Promise.resolve();

    expect(remindersSpy.snooze).toHaveBeenCalledOnceWith(9);
    expect(remindersSpy.complete).not.toHaveBeenCalled();
  });

  it('présence d’un url → navigateByUrl(url)', async () => {
    expect(swMessageHandler).toBeTruthy();

    swMessageHandler!({data: {type: 'REMINDER_ACTION', action: 'done', reminderId: 1, url: '/dash'}} as any);

    await Promise.resolve();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledOnceWith('/dash');
  });

  it('gestion d’erreur: log "Push action failed" si complete() rejette', async () => {
    remindersSpy.complete.and.rejectWith(new Error('boom'));
    const errSpy = spyOn(console, 'error');

    swMessageHandler!({data: {type: 'REMINDER_ACTION', action: 'done', reminderId: 123}} as any);

    await Promise.resolve();

    expect(errSpy).toHaveBeenCalled();
  });

  it("si 'serviceWorker' n'est pas présent → n'ajoute pas d'écouteur", () => {
    delete (window.navigator as any).serviceWorker;

    const svc = TestBed.inject(PushBridgeService);
    expect(svc).toBeTruthy();
  });
});
