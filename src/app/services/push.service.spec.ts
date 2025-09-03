import {TestBed} from '@angular/core/testing';
import {of, ReplaySubject, Subject} from 'rxjs';
import {PushService} from './push.service';
import {SwPush} from '@angular/service-worker';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

describe('PushService', () => {
  let service: PushService;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let messages$: Subject<any>;
  let clicks$: Subject<any>;
  let subscription$: ReplaySubject<PushSubscription | null>;
  let swPushMock: jasmine.SpyObj<SwPush>;
  let getItemSpy: jasmine.Spy<(key: string) => string | null>;
  let setItemSpy: jasmine.Spy<(key: string, value: string) => void>;
  const envApiUrlOriginal = environment.apiUrl;
  const envVapidOriginal = (environment as any).vapidPublicKey;

  function configureDefaultTestBed(opts?: { storage?: string | null; swEnabled?: boolean }) {
    messages$ = new Subject<any>();
    clicks$ = new Subject<any>();
    subscription$ = new ReplaySubject<PushSubscription | null>(1);
    subscription$.next(null);
    swPushMock = jasmine.createSpyObj<SwPush>('SwPush', ['requestSubscription']);

    Object.defineProperty(swPushMock, 'isEnabled', {get: () => opts?.swEnabled ?? true});
    Object.defineProperty(swPushMock, 'messages', {get: () => messages$.asObservable()});
    Object.defineProperty(swPushMock, 'notificationClicks', {get: () => clicks$.asObservable()});
    Object.defineProperty(swPushMock, 'subscription', {get: () => subscription$.asObservable()});

    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);

    environment.apiUrl = 'https://api.test.local';
    (environment as any).vapidPublicKey = 'TEST_VAPID_KEY';

    getItemSpy = spyOn(localStorage, 'getItem').and.returnValue(opts?.storage ?? '[]');
    setItemSpy = spyOn(localStorage, 'setItem').and.stub();

    TestBed.configureTestingModule({
      providers: [
        {provide: SwPush, useValue: swPushMock},
        {provide: HttpClient, useValue: httpSpy},
      ],
    });

    service = TestBed.inject(PushService);
  }

  afterEach(() => {
    messages$.complete();
    clicks$.complete();

    environment.apiUrl = envApiUrlOriginal;
    (environment as any).vapidPublicKey = envVapidOriginal;
  });

  it('should be created', () => {
    configureDefaultTestBed();
    expect(service).toBeTruthy();
  });

  it('restore(): si JSON invalide → notifications = []', () => {
    configureDefaultTestBed({storage: '{"oops":'});
    expect(service.notifications()).toEqual([]);
  });

  it('constructor: réception d’un message → ajoute en tête + persiste', () => {
    configureDefaultTestBed();

    const payload = {notification: {title: 'Titre', body: 'Corps'}, data: {url: '/foo'}};
    messages$.next(payload);

    const list = service.notifications();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Titre');
    expect(list[0].body).toBe('Corps');
    expect(list[0].data).toEqual({url: '/foo'});
    expect(typeof list[0].receivedAt).toBe('string');

    expect(setItemSpy).toHaveBeenCalled();
    const [, savedJson] = setItemSpy.calls.mostRecent().args;
    const saved = JSON.parse(savedJson);
    expect(saved.length).toBe(1);
    expect(saved[0].title).toBe('Titre');
  });

  it('constructor: message sans title → titre par défaut "Notification"', () => {
    configureDefaultTestBed();
    messages$.next({body: 'hello'});
    const list = service.notifications();
    expect(list[0].title).toBe('Notification');
    expect(list[0].body).toBe('hello');
  });

  it('constructor: limite à 50 notifications', () => {
    const fifty = Array.from({length: 50}, (_, i) => ({
      title: `Old ${i + 1}`, body: `B${i + 1}`, data: null, receivedAt: new Date(2020, 0, i + 1).toISOString(),
    }));
    configureDefaultTestBed({storage: JSON.stringify(fifty)});

    messages$.next({notification: {title: 'NEW', body: 'NB'}, data: null});

    const list = service.notifications();
    expect(list.length).toBe(50);
    expect(list[0].title).toBe('NEW');
    expect(list.some(n => n.title === 'Old 50')).toBeFalse();
  });

  it('enablePush(): succès → true & POST /push/subscribe (payload normalisé)', async () => {
    configureDefaultTestBed();

    const fakeSub = {toJSON: () => ({endpoint: 'xxx', keys: {p256dh: 'a', auth: 'b'}})} as any;
    swPushMock.requestSubscription.and.resolveTo(fakeSub);
    httpSpy.post.and.returnValue(of({}));

    const ok = await service.enablePush();

    expect(ok).toBeTrue();
    expect(swPushMock.requestSubscription).toHaveBeenCalledWith({
      serverPublicKey: (environment as any).vapidPublicKey,
    });
    expect(httpSpy.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/push/subscribe`,
      {endpoint: 'xxx', keys: {p256dh: 'a', auth: 'b'}, encoding: 'aes128gcm'}
    );
  });

  it('enablePush(): échec (exception) → false', async () => {
    configureDefaultTestBed();
    const errSpy = spyOn(console, 'error').and.stub();
    swPushMock.requestSubscription.and.rejectWith(new Error('no sw'));
    const ok = await service.enablePush();

    expect(ok).toBeFalse();
    expect(errSpy).toHaveBeenCalled();
    expect(httpSpy.post).not.toHaveBeenCalled();
  });

  it('disablePush(): POST /push/unsubscribe {endpoint} + unsubscribe() navigateur', async () => {
    configureDefaultTestBed();

    const fakeNavSub = {
      endpoint: 'xxx',
      unsubscribe: jasmine.createSpy('unsubscribe').and.resolveTo(true),
    } as any;

    subscription$.next(fakeNavSub);

    httpSpy.post.and.returnValue(of({}));
    await service.disablePush();

    expect(httpSpy.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/push/unsubscribe`,
      {endpoint: 'xxx'}
    );
    expect(fakeNavSub.unsubscribe).toHaveBeenCalled();
  });
});
