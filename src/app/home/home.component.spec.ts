import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Création d'un mock d'AuthService
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);

    // Configuration du module de test
    TestBed.configureTestingModule({
      imports: [HomeComponent, NavBarComponent],  // Utiliser "imports" pour les composants standalone
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: {} } } }  // Mock d'ActivatedRoute
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set username to current user\'s username on init', () => {
    // Simuler un utilisateur avec username et password
    const mockUser = { username: 'testUser', password: 'testPassword' };
    authServiceSpy.getCurrentUser.and.returnValue(of(mockUser));

    // Déclencher la logique du composant (ngOnInit)
    component.ngOnInit();

    // Vérifier que le username est correctement défini
    expect(component.username).toBe('testUser');
  });
});
