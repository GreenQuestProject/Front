import {inject, Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
export type Recurrence = 'NONE'|'DAILY'|'WEEKLY';


@Injectable({
  providedIn: 'root'
})
export class RemindersService {

  constructor() { }

  private http = inject(HttpClient);

  private tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  private apiUrl: string = environment.apiUrl+'/reminders';

  async createByProgression(progressionId: number, whenLocalISO: string, recurrence: Recurrence = 'NONE') {
    return firstValueFrom(this.http.post<{id:number}>(this.apiUrl, {
      progressionId,
      scheduledAt: whenLocalISO,
      timezone: this.tz,
      recurrence
    }));
  }

  complete(id: number) {
    return firstValueFrom(this.http.post(`${this.apiUrl}/${id}/complete`, {}));
  }

  snooze(id: number) {
    return firstValueFrom(this.http.post(`${this.apiUrl}/${id}/snooze`, {}));
  }
}
