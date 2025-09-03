import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {EcoNewsQuery, EcoNewsResponse} from '../interfaces/eco-news';

@Injectable({providedIn: 'root'})
export class ArticlesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  getEcoNews(query: EcoNewsQuery = {}): Observable<EcoNewsResponse> {
    let params = new HttpParams();

    if (query.page != null) params = params.set('page', String(query.page));
    if (query.per_page != null) params = params.set('per_page', String(query.per_page));
    if (query.q) params = params.set('q', query.q);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.order) params = params.set('order', query.order);
    if (query.sources?.length) params = params.set('sources', query.sources.join(','));

    return this.http.get<EcoNewsResponse>(`${this.apiUrl}/eco-news`, {params});
  }
}
