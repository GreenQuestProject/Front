import { Injectable, inject } from '@angular/core';
import { RemindersService } from '../services/reminders.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PushBridgeService {
  private reminders = inject(RemindersService);
  private router = inject(Router);

  constructor() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', async (event: MessageEvent) => {
        const msg = event.data || {};
        if (msg.type !== 'REMINDER_ACTION') return;

        try {
          if (msg.action === 'done' && msg.reminderId)   await this.reminders.complete(msg.reminderId);
          if (msg.action === 'snooze' && msg.reminderId) await this.reminders.snooze(msg.reminderId);
          if (msg.url) this.router.navigateByUrl(msg.url);
          if (msg.action === 'reload') location.reload(); // pour la MAJ PWA
        } catch (e) {
          console.error('Push action failed', e);
        }
      });
    }
  }
}
