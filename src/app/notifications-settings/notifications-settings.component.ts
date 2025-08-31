import {Component, inject, signal} from '@angular/core';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatListModule} from '@angular/material/list';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {NotificationPermissionService} from '../services/notification-permission.service';
import {PushService} from '../services/push.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-notifications-settings',
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './notifications-settings.component.html',
  styleUrl: './notifications-settings.component.scss',
  standalone: true,
})
export class NotificationsSettingsComponent {
  private perms = inject(NotificationPermissionService);
  private snack = inject(MatSnackBar);
  push = inject(PushService);
  private http = inject(HttpClient);
//TODO: Pour V2 implementer la route /preferences
  permission = this.perms.permission;
  enabled = signal(false);

  ngOnInit() {

    this.http.get<{ newChallenge: boolean }>('/api/preferences').subscribe({
      next: (r) => this.enabled.set(!!r?.newChallenge),
      error: () => {}
    });
  }

  async toggle(on: boolean) {
    if (on) {
      const perm = await this.perms.request();
      if (perm !== 'granted') {
        this.snack.open('Autorise les notifications dans ton navigateur', 'OK', { duration: 4000 });
        this.enabled.set(false);
        return;
      }
      const ok = await this.push.enablePush();
      if (!ok) { this.snack.open('Échec de l’activation des push', 'OK', { duration: 3000 }); this.enabled.set(false); return; }
    } else {
      await this.push.disablePush();
    }
    this.enabled.set(on);
    this.http.post('/api/preferences', { newChallenge: on }).subscribe();
  }

  clear() {
    this.push.notifications.set([]);

  }
}
