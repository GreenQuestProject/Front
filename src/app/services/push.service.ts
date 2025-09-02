import { inject, Injectable, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { AppNotification } from '../interfaces/app-notification';

@Injectable({ providedIn: 'root' })
export class PushService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/push`;

  notifications = signal<AppNotification[]>(this.restore());

  private restore(): AppNotification[] {
    try { return JSON.parse(localStorage.getItem('app.notifications') || '[]'); } catch { return []; }
  }
  private persist() { localStorage.setItem('app.notifications', JSON.stringify(this.notifications())); }

  constructor() {
    this.swPush.messages.subscribe((msg: any) => {
      const note: AppNotification = {
        title: msg?.notification?.title || msg?.title || 'Notification',
        body: msg?.notification?.body || msg?.body,
        data: msg?.data,
        receivedAt: new Date().toISOString()
      };
      const next = [note, ...this.notifications()].slice(0, 50);
      this.notifications.set(next);
      this.persist();
    });

    this.swPush.notificationClicks.subscribe(event => {
      const url = (event.notification?.data as any)?.url || '/';
    });
  }

  async enablePush(): Promise<boolean> {
    try {
      if (!this.swPush.isEnabled) {
        console.error('[Push] ServiceWorker non activé (build prod ? HTTPS ? provideServiceWorker ?)');
        return false;
      }
      if (!environment.vapidPublicKey) {
        console.error('[Push] vapidPublicKey manquante dans environment');
        return false;
      }

      const sub = await this.swPush.requestSubscription({ serverPublicKey: environment.vapidPublicKey });
      const raw = (sub as any)?.toJSON ? (sub as any).toJSON() : (sub as any);
      const payload = {
        endpoint: raw.endpoint,
        keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
        encoding: 'aes128gcm',
      };
      await firstValueFrom(this.http.post(`${this.apiUrl}/subscribe`, payload));
      return true;
    } catch (e: any) {
      console.error('[Push] enablePush() failed:', e);
      return false;
    }
  }

  async disablePush(): Promise<void> {
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      const endpoint = sub?.endpoint;
      await firstValueFrom(this.http.post(`${this.apiUrl}/unsubscribe`, { endpoint }));
      await sub?.unsubscribe();
    } catch (e) {
      console.error('[Push] disablePush() failed:', e);
    }
  }
}
