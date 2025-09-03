import {ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {jwtInterceptor} from './interceptors/jwt.interceptor';
import {provideServiceWorker} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {provideCharts, withDefaultRegisterables} from 'ng2-charts';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideServiceWorker('service-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
    importProvidersFrom(MatSnackBarModule),
    {provide: LOCALE_ID, useValue: 'fr-FR'},
    provideCharts(withDefaultRegisterables())
  ]
};
