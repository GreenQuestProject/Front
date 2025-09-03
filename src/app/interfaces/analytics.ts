export interface GamificationProfile {
  xpTotal: number;
  level: number;
  currentStreakDays: number;
  completedCount: number;
  impact: { co2Kg: number; waterL: number; wasteKg: number };
  badges: Array<{ code: string; name: string; rarity: string; unlockedAt: string }>;
}

export interface LeaderboardItem {
  username: string;
  xp_total: number;
}

export interface LeaderboardResponse {
  items: LeaderboardItem[];
}

export interface OverviewWeeklyPoint { x: string; y: number; }
export interface OverviewCategory { key: string; done: number; }

export interface OverviewResponse {
  completed: number;
  completionRate: number;
  medianHours: number;
  weekly: OverviewWeeklyPoint[];
  categories: OverviewCategory[];
}

export interface FunnelRow {
  week: string;
  viewed: number;
  started: number;
  done: number;
  abandoned: number;
}

export interface CohortRow {
  signup_week: string;
  [key: string]: string | number;
}
