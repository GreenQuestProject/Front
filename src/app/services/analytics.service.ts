import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CohortRow, FunnelRow, OverviewResponse} from '../interfaces/analytics';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl: string = environment.apiUrl + '/analytics';

  getOverviewPublic(): Observable<OverviewResponse> {
    return this.http.get<OverviewResponse>(`${this.apiUrl}/overview`);
  }

  getFunnel(from?: string, to?: string): Observable<FunnelRow[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<FunnelRow[]>(`${this.apiUrl}/funnel`, {params});
  }

  getCohorts(from?: string, to?: string): Observable<{ cohorts: CohortRow[] }> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<{ cohorts: CohortRow[] }>(`${this.apiUrl}/cohorts`, {params});
  }
}
