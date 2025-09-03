import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { InstallPromptComponent } from './install-prompt.component';
import { InstallPromptService } from '../services/install-prompt.service';

class InstallPromptServiceStub {
  isIOS = false;
  isStandalone = false;
  show = false;
  showBanner = () => this.show;
  hide = jasmine.createSpy('hide');
  promptInstall = jasmine.createSpy('promptInstall').and.returnValue(Promise.resolve());
}

describe('InstallPromptComponent', () => {
  let fixture: ComponentFixture<InstallPromptComponent>;
  let component: InstallPromptComponent;
  let svc: InstallPromptServiceStub;

  beforeEach(async () => {
    svc = new InstallPromptServiceStub();

    await TestBed.configureTestingModule({
      imports: [InstallPromptComponent],
      providers: [{ provide: InstallPromptService, useValue: svc }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InstallPromptComponent);
    component = fixture.componentInstance;
  });

  function detect() {
    fixture.detectChanges();
  }

  function q(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it('affiche la bannière Android quand showBanner=true, !isIOS, !isStandalone', () => {
    svc.show = true;
    svc.isIOS = false;
    svc.isStandalone = false;

    detect();

    expect(q('.install-banner')).withContext('banner Android visible').not.toBeNull();
    expect(q('.ios-hint')).withContext('hint iOS doit être caché').toBeNull();
  });

  it('clic sur "Installer" appelle svc.promptInstall()', async () => {
    svc.show = true;
    svc.isIOS = false;
    svc.isStandalone = false;

    detect();

    const installBtn = fixture.debugElement.query(By.css('.install-actions .btn:not(.secondary)'));
    expect(installBtn).withContext('bouton Installer présent').not.toBeNull();

    installBtn!.nativeElement.click();
    detect();

    expect(svc.promptInstall).toHaveBeenCalled();
  });

  it('clic sur "Plus tard" appelle svc.hide()', () => {
    svc.show = true;
    svc.isIOS = false;
    svc.isStandalone = false;

    detect();

    const laterBtn = fixture.debugElement.query(By.css('.install-actions .btn.secondary'));
    expect(laterBtn).withContext('bouton Plus tard présent').not.toBeNull();

    laterBtn!.nativeElement.click();
    detect();

    expect(svc.hide).toHaveBeenCalled();
  });

  it('affiche le hint iOS quand isIOS=true et !isStandalone (indépendant de showBanner)', () => {
    svc.show = false;
    svc.isIOS = true;
    svc.isStandalone = false;

    detect();

    expect(q('.ios-hint')).withContext('hint iOS visible').not.toBeNull();
    expect(q('.install-banner')).withContext('banner Android doit être cachée').toBeNull();
  });

  it('ne montre rien si isStandalone=true', () => {
    svc.show = true;
    svc.isIOS = true;
    svc.isStandalone = true;

    detect();

    expect(q('.install-banner')).toBeNull();
    expect(q('.ios-hint')).toBeNull();
  });
});
