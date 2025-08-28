import {Recurrence} from '../services/reminders.service';

export interface Reminder {
  id: number;
  scheduledAtUtc: string;
  timezone: string;
  recurrence: Recurrence;
  active: boolean;
}
