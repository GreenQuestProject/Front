import { TestBed } from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../environments/environment';
import { OverviewResponse, FunnelRow, CohortRow } from '../interfaces/analytics';
import {provideHttpClient} from '@angular/common/http';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl + '/analytics';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnalyticsService, provideHttpClient(),
        provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOverviewPublic() should call GET /overview', () => {
    const mockResponse: OverviewResponse = {
      weekly: [{ x: '2025-W01', y: 10 }],
    } as any;

    service.getOverviewPublic().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/overview`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('getFunnel() without params → GET /funnel sans query', () => {
    const mockRows: FunnelRow[] = [
      { step: 'signup', count: 100 },
      { step: 'first_challenge', count: 50 },
    ] as any;

    service.getFunnel().subscribe(res => {
      expect(res).toEqual(mockRows);
    });

    const req = httpMock.expectOne(r => r.url === `${baseUrl}/funnel`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockRows);
  });

  it('getFunnel() avec from/to → ajoute les query params', () => {
    const mockRows: FunnelRow[] = [{ step: 'signup', count: 5 }] as any;
    service.getFunnel('2025-01-01', '2025-01-31').subscribe(res => {
      expect(res).toEqual(mockRows);
    });

    const req = httpMock.expectOne(r => r.url === `${baseUrl}/funnel`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2025-01-01');
    expect(req.request.params.get('to')).toBe('2025-01-31');
    req.flush(mockRows);
  });

  it('getCohorts() sans params → GET /cohorts', () => {
    const mockResp = {
      cohorts: [
        { signup_week: '2025-W01', retention: 0.8 } as CohortRow,
        { signup_week: '2025-W02', retention: 0.6 } as CohortRow,
      ],
    };

    service.getCohorts().subscribe(res => {
      expect(res).toEqual(mockResp);
    });

    const req = httpMock.expectOne(`${baseUrl}/cohorts`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('getCohorts() avec from/to → ajoute les query params', () => {
    const mockResp = {
      cohorts: [
        { signup_week: '2025-W03', retention: 0.7 } as CohortRow,
      ],
    };

    service.getCohorts('2025-01-01', '2025-01-31').subscribe(res => {
      expect(res).toEqual(mockResp);
    });

    const req = httpMock.expectOne(r => r.url === `${baseUrl}/cohorts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2025-01-01');
    expect(req.request.params.get('to')).toBe('2025-01-31');
    req.flush(mockResp);
  });

});
