import { TestBed } from '@angular/core/testing';
import { InstallPromptService } from './install-prompt.service';

describe('InstallPromptService', () => {
  let service: InstallPromptService;
  let handlers: Record<string, Array<(...args: any[]) => void>>;

  const originalMatchMedia = window.matchMedia;
  const originalStandalone = (navigator as any).standalone;

  function setStandalone(val: boolean) {
    (window as any).matchMedia = ((query: string) => {
      return {
        matches: val && query === '(display-mode: standalone)',
        media: query,
        addListener: () => {},
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as any;
    }) as any;

    try {
      Object.defineProperty(navigator, 'standalone', {
        configurable: true,
        value: val,
      });
    } catch {
      (navigator as any).standalone = val;
    }
  }

  beforeEach(() => {
    handlers = {};
    spyOn(window, 'addEventListener').and.callFake((type: string, cb: any) => {
      (handlers[type] ||= []).push(cb);
      return undefined as any;
    });
  });

  afterEach(() => {
    (window as any).matchMedia = originalMatchMedia;
    try {
      Object.defineProperty(navigator, 'standalone', {
        configurable: true,
        value: originalStandalone,
      });
    } catch {
      (navigator as any).standalone = originalStandalone;
    }
  });

  it('instancie avec showBanner=false et isStandalone selon matchMedia/navigator', () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    expect(service).toBeTruthy();
    expect(service.showBanner()).toBeFalse();
    expect(service.isStandalone).toBeFalse();
  });

  it('affiche la bannière sur beforeinstallprompt si pas standalone', () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    const evt: any = { preventDefault: jasmine.createSpy('preventDefault') };
    handlers['beforeinstallprompt'][0](evt);

    expect(evt.preventDefault).toHaveBeenCalled();
    expect(service.showBanner()).toBeTrue();
  });

  it('ne montre pas la bannière si déjà standalone', () => {
    setStandalone(true);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    const evt: any = { preventDefault: jasmine.createSpy('preventDefault') };
    handlers['beforeinstallprompt'][0](evt);

    expect(service.showBanner()).toBeFalse();
  });

  it('promptInstall() appelle prompt() et ferme la bannière puis reset le deferred', async () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    const evt: any = {
      preventDefault: () => {},
      prompt: jasmine.createSpy('prompt'),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };
    handlers['beforeinstallprompt'][0](evt);
    expect(service.showBanner()).toBeTrue();

    await service.promptInstall();

    expect(evt.prompt).toHaveBeenCalled();
    expect(service.showBanner()).toBeFalse();
  });

  it('promptInstall() est no-op si aucun deferred', async () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    await expectAsync(service.promptInstall()).toBeResolved();
    expect(service.showBanner()).toBeFalse();
  });

  it('refreshStandaloneStatus() met isStandalone=true et ferme la bannière si standalone', () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    service.showBanner.set(true);
    setStandalone(true);

    service.refreshStandaloneStatus();

    expect(service.isStandalone).toBeTrue();
    expect(service.showBanner()).toBeFalse();
  });

  it('visibilitychange déclenche refreshStandaloneStatus()', () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    service.showBanner.set(true);
    setStandalone(true);
    handlers['visibilitychange'][0]();

    expect(service.isStandalone).toBeTrue();
    expect(service.showBanner()).toBeFalse();
  });

  it('hide() ferme la bannière', () => {
    setStandalone(false);
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);

    service.showBanner.set(true);
    service.hide();

    expect(service.showBanner()).toBeFalse();
  });
});
