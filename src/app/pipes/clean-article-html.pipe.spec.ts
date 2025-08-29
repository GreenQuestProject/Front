import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

import { CleanArticleHtmlPipe } from './clean-article-html.pipe';

describe('CleanArticleHtmlPipe', () => {
  let pipe: CleanArticleHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [CleanArticleHtmlPipe],
    });

    pipe = TestBed.inject(CleanArticleHtmlPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  /** util: applique le pipe et renvoie le HTML string “dé-sanitizé” pour assertions */
  const out = (input: string | null | undefined): string =>
    sanitizer.sanitize(SecurityContext.HTML, pipe.transform(input) as SafeHtml) ?? '';

  /** util: renvoie un container DOM pour requêter des éléments */
  const dom = (html: string) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d;
  };

  it('retourne vide pour null/undefined/""', () => {
    expect(out(null)).toBe('');
    expect(out(undefined)).toBe('');
    expect(out('')).toBe('');
  });

  it('supprime script/iframe/object/embed/form/link/style', () => {
    const html = out('<p>ok</p><script>alert(1)</script><iframe></iframe><style>p{}</style>');
    const d = dom(html);
    expect(d.querySelector('script')).toBeNull();
    expect(d.querySelector('iframe')).toBeNull();
    expect(d.querySelector('style')).toBeNull();
    // contenu utile conservé (mais p est aplati en span au §7)
    expect(d.textContent?.trim()).toBe('ok');
  });

  it('retire les attributs on* (onclick, onload...)', () => {
    const html = out('<p onclick="x()" onmouseover="y()">Hello</p>');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('onmouseover');
    // §7 aplatit <p> en <span>
    const d = dom(html);
    expect(d.querySelector('p')).toBeNull();
    expect((d.querySelector('span')?.textContent || '').trim()).toBe('Hello');
  });

  it('liens: supprime les href non http(s)', () => {
    const html = out('<a href="javascript:alert(1)">bad</a><a href="data:text/plain">bad2</a>');
    const d = dom(html);
    expect(d.querySelector('a')).toBeNull();
    expect(d.textContent?.trim()).toBe(''); // tous les liens supprimés (pas d’autre contenu)
  });

  it('liens: média-only → garde le média, enlève le lien', () => {
    const html = out('<a href="https://ok"><img src="https://site/img.jpg"></a>');
    const d = dom(html);
    const a = d.querySelector('a');
    const img = d.querySelector('img');
    expect(a).toBeNull();
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://site/img.jpg');
  });

  it('liens: texte → supprime le lien (et potentiels séparateurs adjacents)', () => {
    const html = out('Hello <a href="https://ex">world</a> - next');
    const d = dom(html);
    expect(d.querySelector('a')).toBeNull();
    // Le texte “world” n’est pas conservé (le lien texte est supprimé)
    // on vérifie qu’il ne reste plus “world”
    expect((d.textContent || '')).not.toContain('world');
  });

  it('médias: supprime les src non http(s) et retire les balises non-whitelistées', () => {
    const html = out(`
    <img src="data:abc">
    <img src="/local.png">
    <img src="https://ok/img.png">
    <video src="http://ok/video.mp4"></video>
    <audio src="http://ok/audio.mp3"></audio>
    <source src="http://ok/video.mp4">
  `);
    const d = dom(html);

    // Seule l'image http(s) reste
    const imgs = Array.from(d.querySelectorAll('img')).map(i => i.getAttribute('src'));
    expect(imgs).toEqual(['https://ok/img.png']);

    // Les balises non-whitelistées sont retirées
    expect(d.querySelector('source')).toBeNull();
    expect(d.querySelector('video')).toBeNull();
    expect(d.querySelector('audio')).toBeNull();
  });


  it('whitelist: enlève les balises non autorisées mais garde le contenu', () => {
    const html = out('<div><h3>Titre</h3><blockquote>quote</blockquote><em>ok</em></div>');
    const d = dom(html);
    // balises non autorisées doivent être retirées
    expect(d.querySelector('div')).toBeNull();
    expect(d.querySelector('h1,h2,h3,blockquote')).toBeNull();
    // <em> autorisé (puis §7 aplatit certains blocs seulement : em reste)
    expect(d.querySelector('em')?.textContent?.trim()).toBe('ok');
    // le texte “Titre” doit rester (aplatit)
    expect(d.textContent || '').toContain('Titre');
  });

  describe('images: styles responsives et attributs', () => {
    const setInnerWidth = (w: number) => {
      // innerWidth est readonly → on la reconfigure pour le test
      Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
    };

    it('desktop/tablette : max-height 220px', () => {
      setInnerWidth(1024);
      const html = out('<img src="https://ok/img.jpg" width="600" height="400">');
      const d = dom(html);
      const img = d.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      // width/height supprimés
      expect(img.hasAttribute('width')).toBeFalse();
      expect(img.hasAttribute('height')).toBeFalse();
      // style inline appliqué
      const style = (img.getAttribute('style') || '').replace(/\s+/g, ' ');
      expect(style).toContain('max-width: 100%');
      expect(style).toContain('height: auto');
      expect(style).toContain('display: block');
      expect(style).toContain('border-radius: 10px');
      expect(style).toContain('object-fit: cover');
      expect(style).toContain('max-height: 220px');
      // attrs perf
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    });

    it('mobile (≤640px) : max-height 100px et border-radius 6px', () => {
      setInnerWidth(480);
      const html = out('<img src="https://ok/img.jpg">');
      const d = dom(html);
      const img = d.querySelector('img') as HTMLImageElement;
      const style = (img.getAttribute('style') || '').replace(/\s+/g, ' ');
      expect(style).toContain('max-height: 100px');
      expect(style).toContain('border-radius: 6px');
    });
  });
});
