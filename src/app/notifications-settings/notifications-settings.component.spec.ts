import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {signal} from '@angular/core';

import {NotificationsSettingsComponent} from './notifications-settings.component';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NotificationPermissionService, NotificationPermissionState} from '../services/notification-permission.service';
import {PushService} from '../services/push.service';
import {environment} from '../../environments/environment';

class NotificationPermissionServiceStub {
  permission = signal<NotificationPermissionState>('default');
  result: NotificationPermissionState = 'granted';

  async request(): Promise<NotificationPermissionState> {
    this.permission.set(this.result);
    return this.result;
  }
}

class PushServiceStub {
  notifications = signal<any[]>([]);
  enablePush = jasmine.createSpy('enablePush').and.resolveTo(true);
  disablePush = jasmine.createSpy('disablePush').and.resolveTo(undefined);
}

describe('NotificationsSettingsComponent', () => {
  let fixture: ComponentFixture<NotificationsSettingsComponent>;
  let comp: NotificationsSettingsComponent;

  let httpSpy: jasmine.SpyObj<HttpClient>;
  let permsStub: NotificationPermissionServiceStub;
  let pushStub: PushServiceStub;

  const envApiUrlOriginal = environment.apiUrl;

  beforeEach(async () => {
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post']);
    permsStub = new NotificationPermissionServiceStub();
    pushStub = new PushServiceStub();

    environment.apiUrl = 'https://api.test.local/api';

    await TestBed.configureTestingModule({
      imports: [NotificationsSettingsComponent],
      providers: [
        {provide: HttpClient, useValue: httpSpy},
        {provide: NotificationPermissionService, useValue: permsStub},
        {provide: PushService, useValue: pushStub},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsSettingsComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    environment.apiUrl = envApiUrlOriginal;
  });

  function detect() {
    fixture.detectChanges();
  }

  it('ngOnInit: GET /preferences et enabled = true quand newChallenge=true', () => {
    httpSpy.get.and.returnValue(of({newChallenge: true}));
    detect();

    expect(httpSpy.get).toHaveBeenCalledWith('https://api.test.local/api/preferences');
    expect(comp.enabled()).toBeTrue();
  });

  it('toggle(true): permission granted + enablePush OK → enabled=true et POST /preferences {true}',
    async () => {
      httpSpy.get.and.returnValue(of({newChallenge: false}));
      detect();

      const snack = fixture.debugElement.injector.get(MatSnackBar);
      const openSpy = spyOn(snack, 'open').and.stub();

      permsStub.result = 'granted';
      pushStub.enablePush.and.resolveTo(true);
      httpSpy.post.and.returnValue(of({}));

      await comp.toggle(true);

      expect(pushStub.enablePush).toHaveBeenCalled();
      expect(comp.enabled()).toBeTrue();
      expect(httpSpy.post).toHaveBeenCalledWith(
        'https://api.test.local/api/preferences',
        {newChallenge: true}
      );
      expect(snack.open).not.toHaveBeenCalledWith(
        jasmine.stringMatching('Échec de l’activation des push'), 'OK', jasmine.anything()
      );
    });

  it('toggle(true): permission denied → snackbar, enabled=false, pas de POST ni enablePush',
    async () => {
      httpSpy.get.and.returnValue(of({newChallenge: false}));
      detect();

      const snack = fixture.debugElement.injector.get(MatSnackBar);
      const openSpy = spyOn(snack, 'open').and.stub();

      permsStub.result = 'denied';

      await comp.toggle(true);

      expect(pushStub.enablePush).not.toHaveBeenCalled();
      expect(comp.enabled()).toBeFalse();
      expect(openSpy).toHaveBeenCalledWith(
        'Autorise les notifications dans ton navigateur',
        'OK',
        {duration: 4000}
      );
      expect(httpSpy.post).not.toHaveBeenCalled();
    });

  it('toggle(true): enablePush=false → snackbar erreur, enabled=false, pas de POST',
    async () => {
      httpSpy.get.and.returnValue(of({newChallenge: false}));
      detect();

      const snack = fixture.debugElement.injector.get(MatSnackBar);
      const openSpy = spyOn(snack, 'open').and.stub();


      permsStub.result = 'granted';
      pushStub.enablePush.and.resolveTo(false);

      await comp.toggle(true);

      expect(pushStub.enablePush).toHaveBeenCalled();
      expect(comp.enabled()).toBeFalse();
      expect(openSpy).toHaveBeenCalledWith(
        'Échec de l’activation des push (voir Console)',
        'OK',
        {duration: 4000}
      );
      expect(httpSpy.post).not.toHaveBeenCalled();
    });

  it('toggle(false): appelle disablePush, enabled=false et POST /preferences {false}',
    async () => {
      httpSpy.get.and.returnValue(of({newChallenge: true}));
      detect();

      const snack = fixture.debugElement.injector.get(MatSnackBar);
      const openSpy = spyOn(snack, 'open').and.stub();


      httpSpy.post.and.returnValue(of({}));

      await comp.toggle(false);

      expect(pushStub.disablePush).toHaveBeenCalled();
      expect(comp.enabled()).toBeFalse();
      expect(httpSpy.post).toHaveBeenCalledWith(
        'https://api.test.local/api/preferences',
        {newChallenge: false}
      );
    });

  it('clear(): vide le centre de notifications (signal)', () => {
    pushStub.notifications.set([{title: 'A'}, {title: 'B'}]);
    comp.clear();
    expect(pushStub.notifications()).toEqual([]);
  });
});
