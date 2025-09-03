import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

import {ProgressionService} from './progression.service';
import {environment} from '../../environments/environment';
import {Progression} from '../interfaces/progression';

describe('ProgressionService', () => {
  let service: ProgressionService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/progression`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(ProgressionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProgressions', () => {
    it('GET sans paramètres quand categories/status sont undefined', () => {
      const mock: Progression[] = [
        {id: 1, status: 'in_progress', challengeId: 10} as unknown as Progression,
      ];

      service.getProgressions().subscribe(res => {
        expect(res).toEqual(mock);
      });

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mock);
    });

    it('GET avec seulement categories', () => {
      const mock: Progression[] = [];
      service.getProgressions(['energy', 'water']).subscribe(res => {
        expect(res).toEqual(mock);
      });

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.get('category')).toBe('energy,water');
      expect(req.request.params.has('status')).toBeFalse();
      req.flush(mock);
    });

    it('GET avec seulement status', () => {
      const mock: Progression[] = [];
      service.getProgressions(undefined, ['in_progress', 'done']).subscribe(res => {
        expect(res).toEqual(mock);
      });

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.get('status')).toBe('in_progress,done');
      expect(req.request.params.has('category')).toBeFalse();
      req.flush(mock);
    });

    it('GET avec categories + status', () => {
      const mock: Progression[] = [
        {id: 2, status: 'done', challengeId: 11} as unknown as Progression,
      ];
      service.getProgressions(['waste'], ['done']).subscribe(res => {
        expect(res).toEqual(mock);
      });

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.get('category')).toBe('waste');
      expect(req.request.params.get('status')).toBe('done');
      req.flush(mock);
    });

    it('GET sans query quand tableaux vides', () => {
      const mock: Progression[] = [];
      service.getProgressions([], []).subscribe(res => {
        expect(res).toEqual(mock);
      });

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mock);
    });

    it('doit propager une erreur HTTP', () => {
      service.getProgressions().subscribe({
        next: () => fail('Ne doit pas émettre en cas d’erreur'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(err.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({message: 'boom'}, {status: 500, statusText: 'Server Error'});
    });
  });

  describe('startChallenge', () => {
    it('POST sur /start/:id avec body vide', () => {
      const challengeId = 42;

      service.startChallenge(challengeId).subscribe(res => {
        expect(res).toEqual({ok: true});
      });

      const req = httpMock.expectOne(`${baseUrl}/start/${challengeId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ok: true});
    });
  });

  describe('removeChallenge', () => {
    it('DELETE sur /remove/:id', () => {
      const challengeId = 7;

      service.removeChallenge(challengeId).subscribe(res => {
        expect(res).toEqual({deleted: true});
      });

      const req = httpMock.expectOne(`${baseUrl}/remove/${challengeId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();
      req.flush({deleted: true});
    });
  });

  describe('validateChallenge', () => {
    it('POST sur /validate/:id avec body vide', () => {
      const challengeId = 9;

      service.validateChallenge(challengeId).subscribe(res => {
        expect(res).toEqual({validated: true});
      });

      const req = httpMock.expectOne(`${baseUrl}/validate/${challengeId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({validated: true});
    });
  });

  describe('updateStatus', () => {
    it('POST sur /status/:progressionId avec body { status }', () => {
      const progressionId = 33;
      const status = 'paused';

      service.updateStatus(progressionId, status).subscribe(res => {
        expect(res).toEqual({updated: true});
      });

      const req = httpMock.expectOne(`${baseUrl}/status/${progressionId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({status});
      req.flush({updated: true});
    });

    it('propagation erreur HTTP sur updateStatus', () => {
      const progressionId = 100;
      const status = 'done';

      service.updateStatus(progressionId, status).subscribe({
        next: () => fail('Ne doit pas émettre en cas d’erreur'),
        error: (err) => {
          expect(err.status).toBe(400);
          expect(err.statusText).toBe('Bad Request');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/status/${progressionId}`);
      req.flush({message: 'invalid status'}, {status: 400, statusText: 'Bad Request'});
    });
  });
});
