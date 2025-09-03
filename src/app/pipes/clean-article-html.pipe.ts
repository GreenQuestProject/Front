import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Pipe({
  name: 'cleanArticleHtml',
  standalone: true
})
export class CleanArticleHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return this.sanitizer.bypassSecurityTrustHtml('');

    const root = document.createElement('div');
    root.innerHTML = value;

    const isBadHref = (href: string | null) =>
      !href || /^(javascript:|data:|about:|vbscript:|mailto:|tel:|about:)/i.test(href);
    const isSepText = (n: ChildNode | null) =>
      !!n && n.nodeType === Node.TEXT_NODE && (/^[\s\u00A0]*[\/\-\|,;:•·–—]+[\s\u00A0]*$/).test(n.textContent || '');

    root.querySelectorAll('script, iframe, object, embed, form, link, style').forEach(el => el.remove());

    root.querySelectorAll<HTMLElement>('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      });
    });

    Array.from(root.querySelectorAll('a')).forEach(a => {
      const href = a.getAttribute('href');
      if (isBadHref(href)) {
        a.remove();
        return;
      }

      const kids = Array.from(a.children);
      const mediaOnly = kids.length > 0 && kids.every(el => /^(IMG|PICTURE|SVG|VIDEO|AUDIO|SOURCE|FIGURE)$/i.test(el.tagName));
      if (mediaOnly) {
        const frag = document.createDocumentFragment();
        while (a.firstChild) frag.appendChild(a.firstChild);
        a.replaceWith(frag);
      } else {
        const prev = a.previousSibling, next = a.nextSibling;
        if (isSepText(prev)) prev?.parentNode?.removeChild(prev);
        if (isSepText(next)) next?.parentNode?.removeChild(next);
        a.remove();
      }
    });

    root.querySelectorAll('img, source, video, audio').forEach(el => {
      const src = el.getAttribute('src');
      if (src && !/^https?:\/\//i.test(src)) el.remove();
    });

    const allowed = new Set(['IMG', 'P', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'BR', 'SPAN', 'SMALL', 'B', 'I', 'FIGURE', 'FIGCAPTION']);
    root.querySelectorAll('*').forEach(el => {
      if (!allowed.has(el.tagName)) {
        const frag = document.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        el.replaceWith(frag);
      }
    });

    root.querySelectorAll('img').forEach(img => {
      img.removeAttribute('width');
      img.removeAttribute('height');

      const s = (img as HTMLElement).style;
      s.maxWidth = '100%';
      s.height = 'auto';
      s.display = 'block';
      s.borderRadius = '10px';
      s.objectFit = 'cover';
      s.maxHeight = '220px';

      if (window.innerWidth <= 640) {
        s.maxHeight = '100px';
        s.borderRadius = '6px';
      }

      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });

    root.querySelectorAll('p, div, h1,h2,h3,h4,h5,h6, blockquote, figure').forEach(el => {
      if (el.tagName === 'FIGURE') return;
      const span = document.createElement('span');
      span.innerHTML = (el as HTMLElement).innerHTML;
      el.replaceWith(span);
    });

    return this.sanitizer.bypassSecurityTrustHtml(root.innerHTML.trim());
  }
}
