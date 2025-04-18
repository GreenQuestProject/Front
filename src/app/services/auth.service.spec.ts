import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import {provideRouter} from '@angular/router';

const mockAuthService = {
  isLoggedIn: () => true,
  isAdmin: () => false,
};
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

