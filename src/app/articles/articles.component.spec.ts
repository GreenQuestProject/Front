import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';

import {ArticlesComponent} from './articles.component';
import {ArticlesService} from '../services/articles.service';
import {AuthService} from '../services/auth.service';
import {Article} from '../interfaces/article';
import {EcoNewsMeta} from '../interfaces/eco-news';
import {ViewportScroller} from '@angular/common';

describe('ArticlesComponent (DOM + logic)', () => {
  let fixture: any;
  let component: ArticlesComponent;
  let element: HTMLElement;

  let articlesSpy: jasmine.SpyObj<ArticlesService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let consoleErrorSpy: jasmine.Spy;
  let viewportSpy: jasmine.SpyObj<ViewportScroller>;

  const ARTICLES_FIXTURE: Article[] = [
    {
      id: 'a1',
      title: 'Premier article',
      description: '<p>Résumé <b>HTML</b></p>',
      image_url: 'https://example.com/img1.jpg',
      link: 'https://example.com/a1',
      source: 'Source A',
      published_at: new Date('2024-10-01').toISOString()
    } as unknown as Article,
    {
      id: 'a2',
      title: 'Second article',
      description: '<p>Autre résumé</p>',
      image_url: '',
      link: 'https://example.com/a2',
      source: 'Source B',
      published_at: new Date('2024-10-02').toISOString()
    } as unknown as Article
  ];

  const META_P1: EcoNewsMeta = {page: 1, per_page: 10, total: 42} as EcoNewsMeta;
  const META_P2: EcoNewsMeta = {page: 2, per_page: 20, total: 42} as EcoNewsMeta;

  beforeEach(async () => {
    articlesSpy = jasmine.createSpyObj<ArticlesService>('ArticlesService', ['getEcoNews']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    viewportSpy = jasmine.createSpyObj<ViewportScroller>('ViewportScroller', ['scrollToPosition']);

    await TestBed.configureTestingModule({
      imports: [ArticlesComponent],
      providers: [
        {provide: ArticlesService, useValue: articlesSpy},
        {provide: AuthService, useValue: authSpy},
        {provide: ViewportScroller, useValue: viewportSpy},
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArticlesComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    consoleErrorSpy = spyOn(console, 'error').and.stub();
  });

  const render = () => fixture.detectChanges();

  const cards = () => element.querySelectorAll('mat-card');
  const spinner = () => element.querySelector('mat-spinner');
  const paginator = () => element.querySelector('mat-paginator');

  it('devrait créer le composant', () => {
    articlesSpy.getEcoNews.and.returnValue(of({data: [], meta: META_P1}));
    render();
    expect(component).toBeTruthy();
  });

  it('ngOnInit: appelle fetch, remplit articles+meta et cache le spinner (DOM vérifié)', () => {
    articlesSpy.getEcoNews.and.returnValue(of({data: ARTICLES_FIXTURE, meta: META_P1}));
    render();

    expect(component.articles).toEqual(ARTICLES_FIXTURE);
    expect(component.meta).toEqual(META_P1);
    expect(component.loading).toBeFalse();

    expect(spinner()).toBeNull();
    expect(cards().length).toBe(2);

    const firstCard = cards()[0] as HTMLElement;
    const titleLink = firstCard.querySelector('.title-wrapper a') as HTMLAnchorElement;
    expect(titleLink.getAttribute('href')).toBe(ARTICLES_FIXTURE[0].link);

    const chips = firstCard.querySelectorAll('mat-chip');
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect((chips[0] as HTMLElement).textContent || '').toContain(ARTICLES_FIXTURE[0].source);
  });

  it('affiche le spinner quand loading=true puis le masque après réponse', () => {
    const pending$ = new Subject<{ data: Article[]; meta: EcoNewsMeta }>();
    articlesSpy.getEcoNews.and.returnValue(pending$.asObservable());

    render();
    expect(spinner()).not.toBeNull();

    pending$.next({data: [], meta: META_P1});
    pending$.complete();
    fixture.detectChanges();

    expect(spinner()).toBeNull();
    expect(component.loading).toBeFalse();
  });

  it('état vide: affiche "Aucun article disponible."', () => {
    articlesSpy.getEcoNews.and.returnValue(of({data: [], meta: META_P1}));
    render();

    const empty = element.querySelector('.container p');
    expect((empty?.textContent || '').trim()).toBe('Aucun article disponible.');
  });

  it('pagination: met à jour page/perPage, relance fetch et scroll en haut', () => {
    articlesSpy.getEcoNews.and.returnValue(of({data: ARTICLES_FIXTURE, meta: META_P1}));
    render();

    const pending2$ = new Subject<{ data: Article[]; meta: EcoNewsMeta }>();
    articlesSpy.getEcoNews.and.returnValue(pending2$.asObservable());

    component.onMatPage({pageIndex: 1, pageSize: 20, length: 42} as any);
    fixture.detectChanges();

    expect(component.page).toBe(2);
    expect(component.perPage).toBe(20);
    expect(viewportSpy.scrollToPosition).toHaveBeenCalledWith([0, 0]);

    pending2$.next({data: [ARTICLES_FIXTURE[0]], meta: META_P2});
    pending2$.complete();
    fixture.detectChanges();

    const pag = paginator();
    expect(pag).not.toBeNull();
    expect(pag?.getAttribute('ng-reflect-length')).toBe('42');
    expect(pag?.getAttribute('ng-reflect-page-index')).toBe('1');
    expect(pag?.getAttribute('ng-reflect-page-size')).toBe('20');
  });

  it('onImgError: applique une image de fallback et la classe', () => {
    const img = document.createElement('img');
    img.src = 'https://ko';
    component.onImgError({target: img} as unknown as Event);
    expect(img.src).toContain('assets/placeholder-news.png');
    expect(img.classList.contains('img-fallback')).toBeTrue();
  });

  it('fetch: passe les bons paramètres (page/per_page + overrides)', () => {
    articlesSpy.getEcoNews.and.returnValue(of({data: [], meta: META_P1}));
    render();

    const firstArgs = (articlesSpy.getEcoNews as jasmine.Spy).calls.mostRecent().args[0] as Partial<EcoNewsMeta>;
    expect(firstArgs.page).toBe(1);
    expect(firstArgs.per_page).toBe(10);

    component.page = 3;
    component.perPage = 40;
    articlesSpy.getEcoNews.calls.reset();
    articlesSpy.getEcoNews.and.returnValue(of({data: [], meta: META_P2}));
    component.fetch({page: 5});
    fixture.detectChanges();

    const lastArgs = (articlesSpy.getEcoNews as jasmine.Spy).calls.mostRecent().args[0] as Partial<EcoNewsMeta>;
    expect(lastArgs.page).toBe(5);
    expect(lastArgs.per_page).toBe(40);
  });

  it('gestion erreur: log console et loading repasse à false', () => {
    articlesSpy.getEcoNews.and.returnValue(throwError(() => new Error('network')));
    render();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });
});
