import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';

describe('LoginComponent (DOM)', () => {
  let fixture: any;
  let component: LoginComponent;
  let element: HTMLElement;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let consoleErrorSpy: jasmine.Spy;

  const getSubmitButton = () =>
    element.querySelector('button[type="submit"]') as HTMLButtonElement;
  const getSpinner = () => element.querySelector('mat-spinner');
  const getGlobalError = () =>
    element.querySelector('.error-message') as HTMLElement | null;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    consoleErrorSpy = spyOn(console, 'error').and.stub();

    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('état initial: bouton disabled, pas de message global, pas de spinner', () => {
    expect(getSubmitButton().disabled).toBeTrue();
    expect(getGlobalError()).toBeNull();
    expect(getSpinner()).toBeNull();
  });

  it('affiche les erreurs mat-error quand les champs sont touchés/invalides', () => {
    component.loginForm.markAllAsTouched();
    fixture.detectChanges();

    const errorTexts = Array.from(
      element.querySelectorAll('.mat-mdc-form-field-error')
    ).map(e => (e.textContent || '').trim());

    expect(errorTexts.some(t => t.includes('Le pseudo est requis.'))).toBeTrue();
    expect(errorTexts.some(t => t.includes('Le mot de passe est requis.'))).toBeTrue();
  });

  it('rend le bouton submit activé quand le formulaire est valide', () => {
    component.loginForm.setValue({ username: 'k', password: 'p@ss' });
    fixture.detectChanges();

    expect(component.loginForm.valid).toBeTrue();
    expect(getSubmitButton().disabled).toBeFalse();
  });

  it('onSubmit invalide: message global, pas d’appel API, pas de navigation', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(getGlobalError()?.textContent).toContain(
      'Veuillez remplir correctement le formulaire avant de le soumettre.'
    );
    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('onSubmit succès: spinner pendant l’appel, puis navigation /défis', () => {
    component.loginForm.setValue({ username: 'k', password: 'p@ss' });

    const pending$ = new Subject<any>();
    authSpy.login.and.returnValue(pending$.asObservable());

    component.onSubmit();
    fixture.detectChanges();
    expect(getSpinner()).not.toBeNull();

    pending$.next({ ok: true });
    pending$.complete();
    fixture.detectChanges();

    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/défis');
    expect(getGlobalError()).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('onSubmit erreur 401: affiche "Identifiants invalides.", pas de navigation', () => {
    component.loginForm.setValue({ username: 'k', password: 'wrong' });
    authSpy.login.and.returnValue(throwError(() => ({ status: 401 })));

    component.onSubmit();
    fixture.detectChanges();

    expect(getGlobalError()?.textContent).toContain('Identifiants invalides.');
    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('onSubmit autre erreur: message générique + console.error', () => {
    component.loginForm.setValue({ username: 'k', password: 'p@ss' });
    authSpy.login.and.returnValue(throwError(() => ({ status: 500 })));

    component.onSubmit();
    fixture.detectChanges();

    expect(getGlobalError()?.textContent).toContain(
      "Une erreur inattendue s'est produite. Veuillez réessayer ultérieurement."
    );
    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('lien "S\'inscrire" pointe vers /register', () => {
    const link = element.querySelector('a[title="S\'inscrire"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('ng-reflect-router-link') || link.getAttribute('href') || '')
      .toContain('/register');
  });

  it('le titre "Connexion" et les champs existent', () => {
    const title = element.querySelector('h1');
    expect(title?.textContent?.trim()).toBe('Connexion');
    expect(element.querySelector('input[formControlName="username"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="password"]')).toBeTruthy();
  });
});
