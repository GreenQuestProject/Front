import { TestBed } from '@angular/core/testing';
import { NotificationPermissionService, NotificationPermissionState } from './notification-permission.service';

describe('NotificationPermissionService', () => {
  let service: NotificationPermissionService;

  // On garde l'original pour restaurer ensuite
  const originalNotification = (window as any).Notification;

  function setNotificationMock(
    permission: NotificationPermissionState,
    requestPermissionImpl?: () => Promise<NotificationPermissionState>
  ) {
    const requestSpy = jasmine.createSpy('requestPermission');
    if (requestPermissionImpl) {
      requestSpy.and.callFake(requestPermissionImpl);
    } else {
      // par défaut, renvoie la permission courante
      requestSpy.and.callFake(async () => permission);
    }

    // Mock minimal de l'API Notification côté navigateur
    (window as any).Notification = {
      permission,
      requestPermission: requestSpy,
    };
    return requestSpy as jasmine.Spy<() => Promise<NotificationPermissionState>>;
  }

  afterEach(() => {
    // Restaure la global après chaque test
    (window as any).Notification = originalNotification;
  });

  it('should be created', () => {
    // permission initiale = default
    setNotificationMock('default');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPermissionService);
    expect(service).toBeTruthy();
  });

  it('init: le signal reflète Notification.permission = denied', () => {
    setNotificationMock('denied');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(NotificationPermissionService);
    expect(s.permission()).toBe('denied');
  });

  it('init: le signal reflète Notification.permission = granted', () => {
    setNotificationMock('granted');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(NotificationPermissionService);
    expect(s.permission()).toBe('granted');
  });

  it("request(): si 'Notification' n'est plus présent → retourne 'denied' et ne touche pas au signal", async () => {
    // Construire le service avec une API présente
    setNotificationMock('default');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(NotificationPermissionService);

    // Supprimer la propriété (important: pas 'undefined')
    delete (window as any).Notification;

    const res = await s.request();
    expect(res).toBe('denied');
    // Le signal reste sur la valeur initiale ('default')
    expect(s.permission()).toBe('default');
  });

  it("request(): si Notification.permission === 'granted' → retourne 'granted' sans appeler requestPermission", async () => {
    const requestSpy = setNotificationMock('granted');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPermissionService);

    const res = await service.request();
    expect(res).toBe('granted');
    expect(requestSpy).not.toHaveBeenCalled();
    expect(service.permission()).toBe('granted');
  });

  it("request(): depuis 'default' → requestPermission résout 'granted' et met à jour le signal", async () => {
    const requestSpy = setNotificationMock('default', async () => 'granted');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPermissionService);

    const res = await service.request();
    expect(requestSpy).toHaveBeenCalled();
    expect(res).toBe('granted');
    expect(service.permission()).toBe('granted');
  });

  it("request(): depuis 'default' → requestPermission résout 'denied' et met à jour le signal", async () => {
    const requestSpy = setNotificationMock('default', async () => 'denied');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPermissionService);

    const res = await service.request();
    expect(requestSpy).toHaveBeenCalled();
    expect(res).toBe('denied');
    expect(service.permission()).toBe('denied');
  });
});
