import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import {environment} from './environments/environment';

if (!environment.production && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister()))
    .then(() => caches?.keys().then(keys => keys.forEach(k => caches.delete(k))))
    .finally(() => console.log('[staging] SW & caches purgés'));
}
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
