import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InstallPromptService {

  private _deferredPrompt: any = null;
  showBanner = signal(false);
  isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this._deferredPrompt = e;
      if (!this.isStandalone) this.showBanner.set(true);
    });

    window.addEventListener('visibilitychange', () => {
      this.refreshStandaloneStatus();
    });
  }

  refreshStandaloneStatus() {
    this.isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (this.isStandalone) this.showBanner.set(false);
  }

  async promptInstall(): Promise<void> {
    if (!this._deferredPrompt) return;
    this._deferredPrompt.prompt();
    await this._deferredPrompt.userChoice;
    this._deferredPrompt = null;
    this.showBanner.set(false);
  }

  hide() { this.showBanner.set(false); }
}
