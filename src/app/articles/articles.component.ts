import {Component, OnInit} from '@angular/core';
import {CommonModule, DatePipe, ViewportScroller} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { ArticlesService } from '../services/articles.service';
import { Article } from '../interfaces/article';
import { EcoNewsMeta } from '../interfaces/eco-news';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {CleanArticleHtmlPipe} from '../pipes/clean-article-html.pipe';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [
    CommonModule, DatePipe, NavBarComponent,
    MatCardModule, MatChipsModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, MatPaginatorModule, MatProgressSpinner, CleanArticleHtmlPipe
  ],
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  loading = true;
  meta?: EcoNewsMeta;
  page = 1;
  perPage = 10;

  constructor(private articlesService: ArticlesService, private viewport: ViewportScroller) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(params: Partial<EcoNewsMeta> = {}): void {
    this.loading = true;

    const query: Partial<EcoNewsMeta> = {
      page: this.page,
      per_page: this.perPage,
      ...params
    };

    this.articlesService.getEcoNews(query).subscribe({
      next: (res) => {
        this.articles = res.data;
        this.meta = res.meta;

        this.page = this.meta?.page ?? this.page;
        this.perPage = this.meta?.per_page ?? this.perPage;

        this.loading = false;

      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.articles = [];
        this.meta = undefined;
      }
    });
  }

  onMatPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.perPage = e.pageSize;
    this.fetch();
    this.viewport.scrollToPosition([0, 0]);
  }

  onImgError(e: Event) {
    const el = e.target as HTMLImageElement;
    el.src = 'assets/placeholder-news.png';
    el.classList.add('img-fallback');
  }

}
