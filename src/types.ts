export type PlanId = '365-day' | 'progressive' | '180-day';

export interface ScheduleDay {
  day: number;
  reading: string;
  chapters: number;
  reflectionPrompt?: string;
}

export interface ReadingPlan {
  id: PlanId;
  title: string;
  tagline: string;
  totalDays: number;
  avgChaptersPerDay: string;
  schedule: ScheduleDay[];
}

export interface ReflectionNote {
  id?: string;
  day: number;
  author: string;
  text: string;
  createdAt?: string;
}

export type ReflectionsMap = Record<number, ReflectionNote[]>;

export interface LedgerMeta {
  code?: string;
  title?: string;
  planId?: PlanId;
  startDate: string;
  members: string[];
}

export type ProgressMap = Record<number, string[]>;

export interface LeaderboardEntry {
  name: string;
  count: number;
}

export type FilterView = 'all' | 'today' | 'catchup' | 'ahead';
