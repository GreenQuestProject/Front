import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { PushService } from './push.service';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

describe('PushService', () => {
  let service: PushService;

  // Mocks/Spies
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let messages$: Subject<any>;
  let clicks$: Subject<any>;
  let swPushMock: {
    messages: any;
    notificationClicks: any;
    requestSubscription: jasmine.Spy;
  };

  // localStorage spies
  let getItemSpy: jasmine.Spy<(key: string) => string | null>;
  let setItemSpy: jasmine.Spy<(key: string, value: string) => void>;

  const envApiUrlOriginal = environment.apiUrl;
  const envVapidOriginal = (environment as any).vapidPublicKey;

  function configureDefaultTestBed() {
    messages$ = new Subject<any>();
    clicks$ = new Subject<any>();
    swPushMock = {
      messages: messages$.asObservable(),
      notificationClicks: clicks$.asObservable(),
      requestSubscription: jasmine.createSpy('requestSubscription'),
    };

    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);

    environment.apiUrl = 'https://api.test.local';
    (environment as any).vapidPublicKey = 'TEST_VAPID_KEY';


    if (!jasmine.isSpy((localStorage as any).getItem)) {
      getItemSpy = spyOn(localStorage, 'getItem').and.returnValue('[]');
    } else {
      getItemSpy = (localStorage.getItem as any); // conserve la valeur existante
    }

    if (!jasmine.isSpy((localStorage as any).setItem)) {
      setItemSpy = spyOn(localStorage, 'setItem').and.stub();
    } else {
      setItemSpy = (localStorage.setItem as any);
    }

    TestBed.configureTestingModule({
      providers: [
        { provide: SwPush, useValue: swPushMock },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(PushService);
  }


  afterEach(() => {
    // nettoyage sujets
    messages$.complete();
    clicks$.complete();
    // restore env
    environment.apiUrl = envApiUrlOriginal;
    (environment as any).vapidPublicKey = envVapidOriginal;
  });

  it('should be created', () => {
    configureDefaultTestBed();
    expect(service).toBeTruthy();
  });

  it('restore(): si JSON invalide → notifications initiales = []', () => {
    // Reconfig pour forcer JSON invalide avant création du service
    messages$ = new Subject<any>();
    clicks$ = new Subject<any>();
    swPushMock = {
      messages: messages$.asObservable(),
      notificationClicks: clicks$.asObservable(),
      requestSubscription: jasmine.createSpy('requestSubscription'),
    };
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);

    environment.apiUrl = 'https://api.test.local';
    (environment as any).vapidPublicKey = 'TEST_VAPID_KEY';

    getItemSpy = spyOn(localStorage, 'getItem').and.returnValue('{"oops":'); // JSON cassé
    setItemSpy = spyOn(localStorage, 'setItem').and.stub();

    TestBed.configureTestingModule({
      providers: [
        { provide: SwPush, useValue: swPushMock },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    const s = TestBed.inject(PushService);
    expect(s.notifications()).toEqual([]);
  });

  it('constructor: réception d’un message → ajoute en tête + persiste', () => {
    configureDefaultTestBed();

    const payload = {
      notification: { title: 'Titre', body: 'Corps' },
      data: { url: '/foo' },
    };
    messages$.next(payload);

    const list = service.notifications();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Titre');
    expect(list[0].body).toBe('Corps');
    expect(list[0].data).toEqual({ url: '/foo' });
    expect(typeof list[0].receivedAt).toBe('string');

    expect(setItemSpy).toHaveBeenCalled();
    const [, savedJson] = setItemSpy.calls.mostRecent().args;
    const saved = JSON.parse(savedJson);
    expect(saved.length).toBe(1);
    expect(saved[0].title).toBe('Titre');
  });

  it('constructor: message sans notification/title → titre par défaut "Notification"', () => {
    configureDefaultTestBed();

    messages$.next({ body: 'hello' }); // ni notification.title ni title
    const list = service.notifications();
    expect(list[0].title).toBe('Notification');
    expect(list[0].body).toBe('hello');
  });

  it('constructor: limite à 50 notifications (la plus ancienne est supprimée)', () => {
    // Prépare la valeur de storage AVANT configureDefaultTestBed
    const fifty = Array.from({ length: 50 }, (_, i) => ({
      title: `Old ${i + 1}`,
      body: `B${i + 1}`,
      data: null,
      receivedAt: new Date(2020, 0, i + 1).toISOString(),
    }));


    if (!jasmine.isSpy((localStorage as any).getItem)) {
      getItemSpy = spyOn(localStorage, 'getItem');
    } else {
      getItemSpy = (localStorage.getItem as any);
    }
    getItemSpy.and.returnValue(JSON.stringify(fifty));

    if (!jasmine.isSpy((localStorage as any).setItem)) {
      setItemSpy = spyOn(localStorage, 'setItem').and.stub();
    } else {
      setItemSpy = (localStorage.setItem as any);
    }

    // Lance l’appareillage
    configureDefaultTestBed(); // ne re-spiera pas

    // Trig: nouveau message → doit rester à 50
    messages$.next({ notification: { title: 'NEW', body: 'NB' }, data: null });

    const list = service.notifications();
    expect(list.length).toBe(50);
    expect(list[0].title).toBe('NEW');
    expect(list.some(n => n.title === 'Old 50')).toBeFalse();
  });


  it('enablePush(): succès → true et POST /push/subscribe (avec sub)', async () => {
    configureDefaultTestBed();

    const fakeSub = { endpoint: 'xxx', keys: { p256dh: 'a', auth: 'b' } } as any;
    swPushMock.requestSubscription.and.resolveTo(fakeSub);
    httpSpy.post.and.returnValue(of({}));

    const ok = await service.enablePush();

    expect(ok).toBeTrue();
    expect(swPushMock.requestSubscription).toHaveBeenCalledWith({
      serverPublicKey: (environment as any).vapidPublicKey,
    });
    expect(httpSpy.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/push/subscribe`,
      fakeSub
    );
  });

  it('enablePush(): échec (exception) → false', async () => {
    configureDefaultTestBed();

    swPushMock.requestSubscription.and.rejectWith(new Error('no sw'));
    const ok = await service.enablePush();

    expect(ok).toBeFalse();
    expect(httpSpy.post).not.toHaveBeenCalled();
  });

  it('disablePush(): appelle POST /push/unsubscribe {}', async () => {
    configureDefaultTestBed();

    httpSpy.post.and.returnValue(of({}));
    await service.disablePush();

    expect(httpSpy.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/push/unsubscribe`,
      {}
    );
  });
});
