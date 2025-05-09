import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import {ActivatedRoute} from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Création d'un mock d'AuthService
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: {} } } }  // Mock d'ActivatedRoute
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
