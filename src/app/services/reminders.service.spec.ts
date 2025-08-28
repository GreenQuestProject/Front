import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RemindersService } from './reminders.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

describe('RemindersService', () => {
  let service: RemindersService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  const originalApiUrl = environment.apiUrl;
  const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);

    // Fixe un apiUrl de test
    environment.apiUrl = 'https://api.example';

    spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .and.returnValue({ timeZone: 'Asia/Tokyo' } as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(RemindersService);
  });

  afterEach(() => {
    // restore globals
    environment.apiUrl = originalApiUrl;
    // rétablit la méthode d'origine pour ne pas polluer d'autres specs
    (Intl.DateTimeFormat.prototype as any).resolvedOptions = originalResolvedOptions;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createByProgression: POST /reminders avec progressionId, scheduledAt, timezone (Intl) et recurrence', async () => {
    httpSpy.post.and.returnValue(of({ id: 42 }));

    const res = await service.createByProgression(7, '2025-08-28T10:00:00', 'WEEKLY');

    expect(httpSpy.post).toHaveBeenCalledWith(
      'https://api.example/reminders',
      {
        progressionId: 7,
        scheduledAt: '2025-08-28T10:00:00',
        timezone: 'Asia/Tokyo',
        recurrence: 'WEEKLY',
      }
    );
    expect(res).toEqual({ id: 42 });
  });

  it('createByProgression: recurrence par défaut = "NONE" quand omise', async () => {
    httpSpy.post.and.returnValue(of({ id: 1 }));

    await service.createByProgression(1, '2025-01-01T09:00:00');

    const [url, body] = httpSpy.post.calls.mostRecent().args;
    expect(url).toBe('https://api.example/reminders');
    expect((body as any).recurrence).toBe('NONE');
  });

  it('complete: POST /reminders/{id}/complete avec {}', async () => {
    httpSpy.post.and.returnValue(of({ ok: true }));

    const out = await service.complete(123);

    expect(httpSpy.post).toHaveBeenCalledWith('https://api.example/reminders/123/complete', {});
    expect(out).toEqual({ ok: true });
  });

  it('snooze: POST /reminders/{id}/snooze avec {}', async () => {
    httpSpy.post.and.returnValue(of({ ok: true }));

    const out = await service.snooze(999);

    expect(httpSpy.post).toHaveBeenCalledWith('https://api.example/reminders/999/snooze', {});
    expect(out).toEqual({ ok: true });
  });
});
