import { TestBed } from '@angular/core/testing';
import { NavBarComponent } from './nav-bar.component';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

describe('NavBarComponent (DOM)', () => {
  let fixture: any;
  let component: NavBarComponent;
  let element: HTMLElement;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [NavBarComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavBarComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  const getByTitle = (title: string) =>
    element.querySelector(`[title="${title}"]`);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('affiche tous les liens/boutons attendus avec leurs titres', () => {
    //expect(getByTitle('Accueil')).toBeTruthy();
    expect(getByTitle('Tous les défis')).toBeTruthy();
    expect(getByTitle('Mes défis')).toBeTruthy();
    expect(getByTitle('Paramètres')).toBeTruthy();
    /*expect(getByTitle('Progression')).toBeTruthy();
    expect(getByTitle('En savoir plus')).toBeTruthy();
    expect(getByTitle('Profil')).toBeTruthy();
    expect(getByTitle('Se déconnecter')).toBeTruthy();*/
  });

  it('clic sur "Se déconnecter" → confirme = true : appelle AuthService.logout()', () => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
    const btn = getByTitle('Se déconnecter') as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledOnceWith('Êtes-vous sûr de vouloir vous déconnecter ?');
    expect(authSpy.logout).toHaveBeenCalledTimes(1);
  });

  it('clic sur "Se déconnecter" → confirme = false : ne rappelle pas logout()', () => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    const btn = getByTitle('Se déconnecter') as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledOnceWith('Êtes-vous sûr de vouloir vous déconnecter ?');
    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('quelques routerLink reflétés dans le DOM', () => {
    const accueil = getByTitle('Accueil');
    const defis = getByTitle('Tous les défis');
    const progression = getByTitle('Mes défis');
    const parametres = getByTitle('Paramètres');

    const reflect = (el: Element | null) =>
      el?.getAttribute('ng-reflect-router-link') || el?.getAttribute('href') || '';

    //expect(reflect(accueil)).toContain('/accueil');
    expect(reflect(defis)).toContain('/défis');
    expect(reflect(progression)).toContain('/progression');
    expect(reflect(parametres)).toContain('/paramètres');
  });
});
