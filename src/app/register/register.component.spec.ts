import { RegisterComponent } from './register.component';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/user';
import { Subject, throwError } from 'rxjs';
import { renderStandalone } from '../../testing/test-helpers';
import { TEXTS } from '../../testing/progression-helpers';

describe('RegisterComponent (DOM)', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const getSubmitButton = (el: HTMLElement) =>
    el.querySelector('button[type="submit"]') as HTMLButtonElement;
  const getSpinner = (el: HTMLElement) => el.querySelector('mat-spinner');
  const getGlobalError = (el: HTMLElement) =>
    el.querySelector('.error-message') as HTMLElement | null;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
  });

  it('devrait créer le composant', async () => {
    const { instance } = await renderStandalone(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    expect(instance).toBeTruthy();
  });

  it('état initial: bouton disabled, pas de message global, pas de spinner', async () => {
    const { instance, element } = await renderStandalone(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    const submitBtn = getSubmitButton(element);
    expect(instance.registerForm.valid).toBeFalse();
    expect(submitBtn.disabled).toBeTrue();
    expect(getGlobalError(element)).toBeNull();
    expect(getSpinner(element)).toBeNull();
  });

  it('affiche les erreurs quand les champs sont touchés/invalides (Material MDC)', async () => {
    const { instance, fixture, element } = await renderStandalone(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });

    instance.registerForm.markAllAsTouched();
    instance.registerForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    fixture.detectChanges();

    const errorTexts = () =>
      Array.from(element.querySelectorAll('.mat-mdc-form-field-error'))
        .map(e => (e.textContent || '').trim());

    let errors = errorTexts();
    expect(errors.some(t => t.includes("L'email est requis."))).toBeTrue();
    expect(errors.some(t => t.includes('Le pseudo est requis.'))).toBeTrue();
    expect(errors.some(t => t.includes('Le pot de passe est requis.'))).toBeTrue();

    const emailCtrl = instance.registerForm.controls['email'];
    emailCtrl.setValue('not-an-email');
    emailCtrl.markAsDirty();
    emailCtrl.markAsTouched();
    emailCtrl.updateValueAndValidity();
    fixture.detectChanges();

    errors = errorTexts();
    expect(errors.some(t => t.includes('Format invalide.'))).toBeTrue();
  });

  it('rend le bouton submit activé quand le formulaire est valide', async () => {
    const { instance, fixture, element } = await renderStandalone(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });

    instance.registerForm.setValue({
      email: 'karina@example.com',
      username: 'karina',
      password: 'password123',
    });
    fixture.detectChanges();

    const submitBtn = getSubmitButton(element);
    expect(instance.registerForm.valid).toBeTrue();
    expect(submitBtn.disabled).toBeFalse();
  });

  it('onSubmit invalide: message global, pas d’appel API, pas de nav', async () => {
    const { instance, fixture, element, navigateByUrlSpy } =
      await renderStandalone(RegisterComponent, {
        providers: [{ provide: AuthService, useValue: authServiceSpy }],
      });

    instance.onSubmit();
    fixture.detectChanges();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
    const globalErr = getGlobalError(element);
    expect(globalErr).not.toBeNull();
    expect(globalErr!.textContent).toContain(TEXTS.formInvalid);
    expect(getSpinner(element)).toBeNull();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('onSubmit succès: spinner pendant l’appel, puis navigation /login', async () => {
    const { instance, fixture, element, navigateByUrlSpy, consoleErrorSpy } =
      await renderStandalone(RegisterComponent, {
        providers: [{ provide: AuthService, useValue: authServiceSpy }],
      });

    instance.registerForm.setValue({
      email: 'karina@example.com',
      username: 'karina',
      password: 'password123',
    });

    const pending$ = new Subject<User>();
    authServiceSpy.register.and.returnValue(pending$.asObservable());

    instance.onSubmit();
    fixture.detectChanges();
    expect(getSpinner(element)).not.toBeNull();

    pending$.next({ id: 1, username: 'karina', email: 'karina@example.com' } as any);
    pending$.complete();
    fixture.detectChanges();

    expect(getSpinner(element)).toBeNull();
    expect(navigateByUrlSpy).toHaveBeenCalledOnceWith('/login');
    expect(getGlobalError(element)).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('onSubmit erreur API: message global, pas de nav, log console', async () => {
    const { instance, fixture, element, navigateByUrlSpy, consoleErrorSpy } =
      await renderStandalone(RegisterComponent, {
        providers: [{ provide: AuthService, useValue: authServiceSpy }],
      });

    instance.registerForm.setValue({
      email: 'karina@example.com',
      username: 'karina',
      password: 'password123',
    });

    authServiceSpy.register.and.returnValue(throwError(() => new Error('backend down')));

    instance.onSubmit();
    fixture.detectChanges();

    const globalErr = getGlobalError(element);
    expect(globalErr).not.toBeNull();
    expect(globalErr!.textContent).toContain(TEXTS.registerErr);
    expect(getSpinner(element)).toBeNull();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(String(consoleErrorSpy.calls.mostRecent().args[0])).toContain('Error while registering');
  });

  it('lien "Se connecter" pointe vers /login', async () => {
    const { element } = await renderStandalone(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    const link = element.querySelector('a[title="S\'inscrire"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('ng-reflect-router-link') || link.getAttribute('href') || '')
      .toContain('/login');
  });

  it('le titre "Inscription" et les champs existent', async () => {
    const { element } = await renderStandalone(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    const title = element.querySelector('h1');
    expect(title?.textContent?.trim()).toBe('Inscription');
    expect(element.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="username"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="password"]')).toBeTruthy();
  });
});
