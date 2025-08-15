import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/user';
import { provideRouter, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';

describe('RegisterComponent (DOM)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let element: HTMLElement;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent], // standalone, le composant importe déjà Material & ReactiveForms
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    // éviter le bruit console dans les tests
    consoleErrorSpy = spyOn(console, 'error').and.stub();

    fixture.detectChanges();
  });

  function getSubmitButton(): HTMLButtonElement {
    return element.querySelector('button[type="submit"]') as HTMLButtonElement;
  }
  function getSpinner(): Element | null {
    return element.querySelector('mat-spinner');
  }
  function getGlobalError(): HTMLElement | null {
    return element.querySelector('.error-message');
  }

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('état initial: bouton disabled, pas de message d’erreur global, pas de spinner', () => {
    const submitBtn = getSubmitButton();
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.disabled).toBeTrue();

    expect(getGlobalError()).toBeNull();
    expect(getSpinner()).toBeNull();
  });

  it('affiche les erreurs quand les champs sont touchés/invalides (Material MDC)', () => {
    const host = element;

    // 1) Champs vides -> erreurs "required"
    component.registerForm.markAllAsTouched();
    component.registerForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    fixture.detectChanges();

    const getErrorTexts = () =>
      Array.from(host.querySelectorAll('.mat-mdc-form-field-error'))
        .map(e => (e.textContent || '').trim());

    let errors = getErrorTexts();
    expect(errors.some(t => t.includes("L'email est requis."))).toBeTrue();
    expect(errors.some(t => t.includes('Le pseudo est requis.'))).toBeTrue();
    expect(errors.some(t => t.includes('Le pot de passe est requis.'))).toBeTrue();

    // 2) Email au mauvais format -> "Format invalide."
    const emailCtrl = component.registerForm.controls['email'];
    emailCtrl.setValue('not-an-email');
    emailCtrl.markAsDirty();
    emailCtrl.markAsTouched();
    emailCtrl.updateValueAndValidity();
    fixture.detectChanges();

    errors = getErrorTexts();
    expect(errors.some(t => t.includes('Format invalide.'))).toBeTrue();
  });

  it('rend le bouton submit activé quand le formulaire est valide', () => {
    component.registerForm.setValue({
      email: 'karina@example.com',
      username: 'karina',
      password: 'password123',
    });
    fixture.detectChanges();

    const submitBtn = getSubmitButton();
    expect(component.registerForm.valid).toBeTrue();
    expect(submitBtn.disabled).toBeFalse();
  });

  it('onSubmit avec formulaire invalide: message d’erreur global, pas d’appel API, pas de navigation', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
    const globalErr = getGlobalError();
    expect(globalErr).not.toBeNull();
    expect(globalErr!.textContent).toContain("Veuillez remplir correctement le formulaire avant de le soumettre.");
    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('onSubmit succès: spinner visible pendant l’appel, puis navigation /login', async () => {
    component.registerForm.setValue({
      email: 'karina@example.com',
      username: 'karina',
      password: 'password123',
    });

    // contrôle de l'asynchro avec Subject
    const pending$ = new Subject<User>();
    authServiceSpy.register.and.returnValue(pending$.asObservable());

    component.onSubmit();
    fixture.detectChanges();

    // spinner visible pendant l'appel
    expect(getSpinner()).not.toBeNull();

    // Réponse API -> fin du loading
    pending$.next({ id: 1, username: 'karina', email: 'karina@example.com' } as unknown as User);
    pending$.complete();
    fixture.detectChanges();

    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
    expect(getGlobalError()).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('onSubmit erreur API: affiche message d’erreur global, pas de navigation et log console', () => {
    component.registerForm.setValue({
      email: 'karina@example.com',
      username: 'karina',
      password: 'password123',
    });

    authServiceSpy.register.and.returnValue(throwError(() => new Error('backend down')));

    component.onSubmit();
    fixture.detectChanges();

    const globalErr = getGlobalError();
    expect(globalErr).not.toBeNull();
    expect(globalErr!.textContent).toContain("Une erreur inattendue s'est produite. Veuillez réessayer ultérieurement.");
    expect(getSpinner()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    // Vérifie que l'erreur est bien loggée
    expect(consoleErrorSpy).toHaveBeenCalled();
    const [firstArg] = consoleErrorSpy.calls.mostRecent().args;
    expect(String(firstArg)).toContain('Error while registering');
  });

  it('lien "Se connecter" pointe vers /login', () => {
    const link = element.querySelector('a[title="S\'inscrire"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('ng-reflect-router-link') || link.getAttribute('href') || '')
      .toContain('/login');
  });

  it('le titre "Inscription" et les champs existent', () => {
    const title = element.querySelector('h1');
    expect(title?.textContent?.trim()).toBe('Inscription');

    expect(element.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="username"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="password"]')).toBeTruthy();
  });
});
