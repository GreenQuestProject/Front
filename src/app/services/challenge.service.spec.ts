import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ChallengeService } from './challenge.service';
import { environment } from '../../environments/environment';
import { Challenge } from '../interfaces/challenge';
import { ChallengeCategory } from '../interfaces/challenge-category';
import { ChallengeStatus } from '../interfaces/challenge-status';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ChallengeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Vérifie qu’il ne reste aucune requête en attente
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getChallenges() doit faire un GET sans param quand categories est undefined', () => {
    const mockResponse: Challenge[] = [
      { id: 1, title: 'Test', category: 'energy' } as unknown as Challenge,
    ];

    service.getChallenges().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${apiUrl}/challenge`
    );

    // pas de paramètre "category"
    expect(req.request.params.has('category')).toBeFalse();

    req.flush(mockResponse);
  });

  it('getChallenges() doit ajouter le param category quand categories est non vide', () => {
    const cats = ['energy', 'water'];
    const mockResponse: Challenge[] = [
      { id: 2, title: 'Eau', category: 'water' } as unknown as Challenge,
    ];

    service.getChallenges(cats).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${apiUrl}/challenge`
    );

    expect(req.request.params.get('category')).toBe('energy,water');

    req.flush(mockResponse);
  });

  it('getChallenges() ne doit pas ajouter de param quand categories est un tableau vide', () => {
    const mockResponse: Challenge[] = [];

    service.getChallenges([]).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${apiUrl}/challenge`
    );

    expect(req.request.params.has('category')).toBeFalse();

    req.flush(mockResponse);
  });

  it('getChallenges() doit propager une erreur HTTP', () => {
    const status = 500;
    const statusText = 'Server Error';

    service.getChallenges().subscribe({
      next: () => fail('Le flux ne doit pas émettre en cas d’erreur'),
      error: (err) => {
        expect(err.status).toBe(status);
        expect(err.statusText).toBe(statusText);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/challenge`);
    req.flush({ message: 'boom' }, { status, statusText });
  });

  it('getChallengeCategories() doit faire un GET /challenge/enums/categories et retourner la liste', () => {
    const mock: ChallengeCategory[] = [
      { name: 'ENERGY', value: 'energy' } as ChallengeCategory,
      { name: 'WATER',  value: 'water'  } as ChallengeCategory,
    ];

    service.getChallengeCategories().subscribe(res => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${apiUrl}/challenge/enums/categories`
    );
    req.flush(mock);
  });

  it('getChallengeStatus() doit faire un GET /challenge/enums/status et retourner la liste', () => {
    const mock: ChallengeStatus[] = [
      { name: 'PENDING',  value: 'pending'  } as ChallengeStatus,
      { name: 'ONGOING',  value: 'ongoing'  } as ChallengeStatus,
      { name: 'DONE',     value: 'done'     } as ChallengeStatus,
    ];

    service.getChallengeStatus().subscribe(res => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' &&
      r.url === `${apiUrl}/challenge/enums/status`
    );
    req.flush(mock);
  });

  it('getChallengeCategories() doit propager une erreur HTTP', () => {
    const status = 502;
    const statusText = 'Bad Gateway';

    service.getChallengeCategories().subscribe({
      next: () => fail('Ne doit pas émettre en cas d’erreur'),
      error: (err) => {
        expect(err.status).toBe(status);
        expect(err.statusText).toBe(statusText);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/challenge/enums/categories`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'upstream down' }, { status, statusText });
  });

  it('getChallengeStatus() doit propager une erreur HTTP', () => {
    const status = 404;
    const statusText = 'Not Found';

    service.getChallengeStatus().subscribe({
      next: () => fail('Ne doit pas émettre en cas d’erreur'),
      error: (err) => {
        expect(err.status).toBe(status);
        expect(err.statusText).toBe(statusText);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/challenge/enums/status`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'missing' }, { status, statusText });
  });

});
