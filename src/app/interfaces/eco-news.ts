import { Article } from './article';

export type SortField = 'date' | 'title' | 'source';
export type SortOrder = 'asc' | 'desc';

export interface EcoNewsQuery {
  page?: number;
  per_page?: number;
  q?: string;
  sort?: SortField;
  order?: SortOrder;
  sources?: string[];
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
