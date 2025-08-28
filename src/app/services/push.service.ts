import {inject, Injectable, signal} from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {AppNotification} from '../interfaces/app-notification';



@Injectable({
  providedIn: 'root'
})
export class PushService {

  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  private apiUrl: string = environment.apiUrl+'/push';
  // centre de notifications in-app (dernier 50)
  notifications = signal<AppNotification[]>(this.restore());

  private restore(): AppNotification[] {
    try { return JSON.parse(localStorage.getItem('app.notifications') || '[]'); } catch { return []; }
  }
  private persist() { localStorage.setItem('app.notifications', JSON.stringify(this.notifications())); }

  constructor() {
// messages émis quand l’app est au premier-plan par le SW Angular
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

// clics sur notifications (quand l’utilisateur clique sur une notif push)
    this.swPush.notificationClicks.subscribe(event => {
      const url = (event.notification?.data as any)?.url || '/';
// Laisser le SW ouvrir/focus; ici on peut router si l’app est déjà ouverte
// location.assign(url); // option : déléguer au router
    });
  }

  async enablePush(): Promise<boolean> {
    try {
      const sub = await this.swPush.requestSubscription({ serverPublicKey: environment.vapidPublicKey });
      await firstValueFrom(this.http.post(`${this.apiUrl}/subscribe`, sub));
      return true;
    } catch { return false; }
  }

  async disablePush(): Promise<void> {
    try { await firstValueFrom(this.http.post(`${this.apiUrl}/unsubscribe`, {})); } finally {}
  }
}
