export interface Article {
  source: string;
  title: string;
  link: string;
  description?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}
