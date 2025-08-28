
export interface Progression {
  id: number;
  challengeId: number;
  description: string;
  name: string;
  category: string;
  status: string;
  startedAt: string;
  completedAt: string;
  reminderId?: number | null;
  nextReminderUtc?: string | null;
  recurrence?: 'NONE'|'DAILY'|'WEEKLY';
}
