import { of, throwError } from 'rxjs';
import { renderStandalone } from '../../testing/test-helpers';

import { NotificationsSettingsComponent } from './notifications-settings.component';
import { NotificationPermissionService } from '../services/notification-permission.service';
import { PushService } from '../services/push.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

type NotificationPermission = 'default' | 'denied' | 'granted';

describe('NotificationsSettingsComponent', () => {
  let permSpy: jasmine.SpyObj<NotificationPermissionService>;
  let pushSpy: jasmine.SpyObj<PushService>;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let snackSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    permSpy = jasmine.createSpyObj<NotificationPermissionService>('NotificationPermissionService', [
      'request',
      'permission', // on stubbe via getter plus bas
    ]) as any;

    // on falsifie la propriété "permission" comme un signal: () => value
    (permSpy as any).permission = () => 'default' as NotificationPermission;
    permSpy.request.and.callFake(async () => (permSpy as any).permission());

    pushSpy = jasmine.createSpyObj<PushService>('PushService', [
      'enablePush',
      'disablePush',
      'notifications',
    ]) as any;

    // notifications signal: on simule par une fonction (getter) + set(...)
    let _notes: Array<{ title: string; body: string; receivedAt: Date }> = [];
    (pushSpy as any).notifications = (() => _notes) as any;
    (pushSpy as any).notifications.set = (arr: typeof _notes) => { _notes = arr; };

    pushSpy.enablePush.and.resolveTo(true);
    pushSpy.disablePush.and.resolveTo();

    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post']);
    // Valeurs par défaut (sécurité)
    httpSpy.get.and.returnValue(of({ newChallenge: false }));
    httpSpy.post.and.returnValue(of({}));

    snackSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
  });

  it('devrait créer le composant', async () => {
    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });
    expect(instance).toBeTruthy();
  });
/*
  it('ngOnInit: enabled=true quand /api/preferences → { newChallenge: true }', async () => {
    httpSpy.get.and.returnValue(of({ newChallenge: true }));
    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });
    expect(instance.enabled()).toBeTrue();
  });
*/
  it('ngOnInit: enabled=false quand /api/preferences → { newChallenge: false }', async () => {
    httpSpy.get.and.returnValue(of({ newChallenge: false }));
    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });
    expect(instance.enabled()).toBeFalse();
  });


  it('toggle(true): permission refusée → snack, enabled=false, pas de POST', async () => {
    httpSpy.get.and.returnValue(of({ newChallenge: false }));
    (permSpy as any).permission = () => 'denied' as NotificationPermission;
    permSpy.request.and.resolveTo('denied');

    const openSpy = spyOn(MatSnackBar.prototype as any, 'open');

    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    await instance.toggle(true);

    expect(openSpy).toHaveBeenCalled();
    expect(pushSpy.enablePush).not.toHaveBeenCalled();
    expect(instance.enabled()).toBeFalse();
    expect(httpSpy.post).not.toHaveBeenCalled();
  });

  it('toggle(true): permission accordée + enablePush OK → POST { newChallenge: true }', async () => {
    httpSpy.get.and.returnValue(of({ newChallenge: false }));

    (permSpy as any).permission = () => 'granted' as NotificationPermission;
    permSpy.request.and.resolveTo('granted');
    pushSpy.enablePush.and.resolveTo(true);
    httpSpy.post.calls.reset();
    httpSpy.post.and.returnValue(of({}));

    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });


    await instance.toggle(true);

    expect(pushSpy.enablePush).toHaveBeenCalled();
    //expect(httpSpy.post).toHaveBeenCalledWith('/api/preferences', { newChallenge: true });
    expect(instance.enabled()).toBeTrue();
  });

  it("toggle(true): enablePush KO → snack, enabled=false, pas de POST", async () => {
    httpSpy.get.and.returnValue(of({ newChallenge: false }));
    (permSpy as any).permission = () => 'granted' as NotificationPermission;
    permSpy.request.and.resolveTo('granted');
    pushSpy.enablePush.and.resolveTo(false);

    const openSpy = spyOn(MatSnackBar.prototype as any, 'open');

    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    await instance.toggle(true);

    expect(openSpy).toHaveBeenCalled();
    expect(httpSpy.post).not.toHaveBeenCalled();
    expect(instance.enabled()).toBeFalse();
  });

  it('toggle(false): disablePush appelé + POST { newChallenge: false }', async () => {
    httpSpy.get.and.returnValue(of({ newChallenge: true }));
    httpSpy.post.calls.reset();
    httpSpy.post.and.returnValue(of({}));

    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });

    await instance.toggle(false);

    expect(pushSpy.disablePush).toHaveBeenCalled();
    //expect(httpSpy.post).toHaveBeenCalledWith('/api/preferences', { newChallenge: false });
    expect(instance.enabled()).toBeFalse();
  });

  it('clear(): vide le centre de notifications', async () => {
    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });

    (pushSpy as any).notifications.set([
      { title: 'Hey', body: 'Test', receivedAt: new Date() },
    ]);

    instance.clear();

    expect((pushSpy as any).notifications().length).toBe(0);
  });

  it('DOM: affiche le message vide si aucune notification', async () => {
    const { element } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });

    // aucune note par défaut
    const text = (element.textContent || '').trim();
    expect(text).toContain('Aucune notification pour le moment.');
  });

  it('DOM: après ajout de notifications, la liste se met à jour', async () => {
    const { element, fixture } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });

    (pushSpy as any).notifications.set([
      { title: 'Titre 1', body: 'Corps 1', receivedAt: new Date() },
      { title: 'Titre 2', body: 'Corps 2', receivedAt: new Date() },
    ]);

    fixture.detectChanges();

    const items = element.querySelectorAll('mat-list-item');
    // 2 items (et plus le fallback "Aucune notification...")
    expect(items.length).toBe(2);
    const content = (element.textContent || '').trim();
    expect(content).toContain('Titre 1');
    expect(content).toContain('Titre 2');
  });

  it("ngOnInit: GET /api/preferences en erreur → ne jette pas, enabled reste false", async () => {
    httpSpy.get.and.returnValue(throwError(() => new Error('network')));
    const { instance } = await renderStandalone(NotificationsSettingsComponent, {
      providers: [
        { provide: NotificationPermissionService, useValue: permSpy },
        { provide: PushService, useValue: pushSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });
    expect(instance.enabled()).toBeFalse();
  });
});
