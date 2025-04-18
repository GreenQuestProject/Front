import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {provideRouter} from '@angular/router';
import {AuthService} from './services/auth.service';
const mockAuthService = {
  isLoggedIn: () => true,
  isAdmin: () => false,
};
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
