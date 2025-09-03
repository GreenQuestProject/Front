import {Injectable, signal} from '@angular/core';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

@Injectable({
  providedIn: 'root'
})
export class NotificationPermissionService {

  permission = signal<NotificationPermissionState>(Notification.permission as NotificationPermissionState);

  constructor() {
  }

  async request(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    const res = await Notification.requestPermission();
    this.permission.set(res as NotificationPermissionState);
    return res as NotificationPermissionState;
  }
}
