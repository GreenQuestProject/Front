import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {AuthService} from '../services/auth.service';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {NavBarComponent} from '../nav-bar/nav-bar.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      imports: [HomeComponent, NavBarComponent],
      providers: [
        {provide: AuthService, useValue: authServiceSpy},
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {}}}}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set username to current user\'s username on init', () => {
    const mockUser = {username: 'testUser', password: 'testPassword'};
    authServiceSpy.getCurrentUser.and.returnValue(of(mockUser));

    component.ngOnInit();

    expect(component.username).toBe('testUser');
  });
});
