import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

import { ArticlesService } from './articles.service';
import { EcoNewsQuery, EcoNewsResponse, SortField, SortOrder } from '../interfaces/eco-news';

const TEST_API_URL = 'http://test.local/api';

describe('ArticlesService (HTTP)', () => {
  let service: ArticlesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      // On fournit le service via une factory pour injecter une apiUrl de test
      providers: [
        {
          provide: ArticlesService,
          useFactory: (http: HttpClient) => {
            const s = new ArticlesService(http);
            (s as any).apiUrl = TEST_API_URL; // override de la propriété privée
            return s;
          },
          deps: [HttpClient],
        },
      ],
    });

    service = TestBed.inject(ArticlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getEcoNews(): sans query → GET /eco-news sans params', () => {
    const expectedUrl = `${TEST_API_URL}/eco-news`;

    let actualResponse: EcoNewsResponse | undefined;
    service.getEcoNews().subscribe((res) => (actualResponse = res));

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);
    expect(req.request.params.keys().length).toBe(0); // aucun paramètre

    const mockBody: EcoNewsResponse = {
      data: [],
      meta: { page: 1, per_page: 10, total: 0 } as any,
    };
    req.flush(mockBody);

    expect(actualResponse).toEqual(mockBody);
  });

  it('getEcoNews(): construit correctement tous les paramètres', () => {
    const expectedUrl = `${TEST_API_URL}/eco-news`;

    const query: EcoNewsQuery = {
      page: 3,
      per_page: 40,
      q: 'biodiversité',
      sort: 'date' as SortField,   // <-- remplacé 'published_at'
      order: 'desc' as SortOrder,  // <-- valide
      sources: ['lemonde', 'guardian', 'nyt'],
    };

    service.getEcoNews(query).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);

    // Vérifie chaque paramètre encodé en string
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('per_page')).toBe('40');
    expect(req.request.params.get('q')).toBe('biodiversité');
    expect(req.request.params.get('sort')).toBe('date');
    expect(req.request.params.get('order')).toBe('desc');
    expect(req.request.params.get('sources')).toBe('lemonde,guardian,nyt');

    req.flush({ data: [], meta: { page: 3, per_page: 40, total: 0 } as any });
  });

  it('getEcoNews(): ignore les valeurs null/undefined (ne passe pas le param)', () => {
    const expectedUrl = `${TEST_API_URL}/eco-news`;

    // On met volontairement null/undefined
    const query: EcoNewsQuery = {
      page: undefined,
      per_page: undefined,
      q: undefined,
      sort: undefined,
      order: undefined,
      sources: [],
    };


    service.getEcoNews(query).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);

    // Aucun de ces params ne doit apparaître
    const keys = req.request.params.keys();
    expect(keys).toEqual([]); // vide

    req.flush({ data: [], meta: { page: 1, per_page: 10, total: 0 } as any });
  });

  it('getEcoNews(): retourne un EcoNewsResponse typé', () => {
    const expectedUrl = `${TEST_API_URL}/eco-news`;

    const body: EcoNewsResponse = {
      data: [
        {
          id: 'a1',
          title: 'Titre',
          description: '<p>desc</p>',
          image_url: 'https://exemple/img.jpg',
          link: 'https://exemple/a1',
          source: 'Source A',
          published_at: new Date('2025-01-01').toISOString(),
        } as any,
      ],
      meta: { page: 2, per_page: 20, total: 100 } as any,
    };

    let received: EcoNewsResponse | undefined;
    service.getEcoNews({ page: 2, per_page: 20 }).subscribe((res) => (received = res));

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);
    req.flush(body);

    expect(received).toEqual(body);
    expect(received?.meta.page).toBe(2);
    expect(received?.meta.per_page).toBe(20);
    expect(received?.data.length).toBe(1);
  });
});
