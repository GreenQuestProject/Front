import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  // Petit store en mémoire pour simuler localStorage
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    // On mocke les méthodes de localStorage AVANT la création du service
    spyOn(window.localStorage, 'getItem').and.callFake((key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    });
    spyOn(window.localStorage, 'setItem').and.callFake((key: string, value: string): void => {
      store[key] = String(value);
    });
    spyOn(window.localStorage, 'removeItem').and.callFake((key: string): void => {
      delete store[key];
    });

    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    service = TestBed.inject(TokenService);
    expect(service).toBeTruthy();
  });

  it('charge les tokens depuis localStorage au constructeur', () => {
    // Seed avant l’injection du service
    store['accessToken'] = 'A1';
    store['refreshToken'] = 'R1';

    service = TestBed.inject(TokenService);
    expect(service.getAccessToken()).toBe('A1');
    expect(service.getRefreshToken()).toBe('R1');

    // getItem appelé pour chaque token
    expect(window.localStorage.getItem).toHaveBeenCalledWith('accessToken');
    expect(window.localStorage.getItem).toHaveBeenCalledWith('refreshToken');
  });

  it('getters retournent null si rien en storage au démarrage', () => {
    // Pas de seed
    service = TestBed.inject(TokenService);
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('setAccessToken met à jour la mémoire et localStorage', () => {
    service = TestBed.inject(TokenService);

    service.setAccessToken('NEW_A');
    expect(service.getAccessToken()).toBe('NEW_A');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'NEW_A');

    // overwrite
    service.setAccessToken('NEW_A2');
    expect(service.getAccessToken()).toBe('NEW_A2');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'NEW_A2');
  });

  it('setRefreshToken met à jour la mémoire et localStorage', () => {
    service = TestBed.inject(TokenService);

    service.setRefreshToken('NEW_R');
    expect(service.getRefreshToken()).toBe('NEW_R');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'NEW_R');

    // overwrite
    service.setRefreshToken('NEW_R2');
    expect(service.getRefreshToken()).toBe('NEW_R2');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'NEW_R2');
  });

  it('clearTokens nettoie la mémoire et localStorage', () => {
    store['accessToken'] = 'A1';
    store['refreshToken'] = 'R1';
    service = TestBed.inject(TokenService);

    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('enchaînement set puis clear', () => {
    service = TestBed.inject(TokenService);

    service.setAccessToken('A2');
    service.setRefreshToken('R2');
    expect(service.getAccessToken()).toBe('A2');
    expect(service.getRefreshToken()).toBe('R2');

    service.clearTokens();
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });
});
