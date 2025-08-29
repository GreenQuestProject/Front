import { Article } from './article';

export type SortField = 'date' | 'title' | 'source';
export type SortOrder = 'asc' | 'desc';

export interface EcoNewsQuery {
  page?: number;          // défaut 1
  per_page?: number;      // défaut 20 (max 100)
  q?: string;
  sort?: SortField;       // défaut 'date'
  order?: SortOrder;      // défaut 'desc'
  sources?: string[];     // ex: ['reporterre.net','actu-environnement.com']
}

export interface EcoNewsMeta {
  page: number;
  per_page: number;
  total: number;
  page_count: number;
  sort: SortField;
  order: SortOrder;
  q: string;
  sources: string[];
}

export interface EcoNewsResponse {
  data: Article[];
  meta: EcoNewsMeta;
}
