export interface CustomDayEntry {
  day: number;
  week: number;
  reading: string;
  chapters: number;
  readUrl: string;
  prayerPoint: string;
}

export interface ScheduleDay {
  day: number;
  reading: string;
  chapters: number;
  reflectionPrompt?: string;
}

export interface ReflectionNote {
  id?: string;
  day: number;
  author: string;
  text: string;
  isPublic: boolean;
  createdAt?: string;
}

export type ReflectionsMap = Record<number, ReflectionNote[]>;

export interface PrayerRequest {
  id: string;
  author: string;
  week: number;
  text: string;
  createdAt: string;
  isAnswered?: boolean;
}

export interface LedgerMeta {
  code?: string;
  title?: string;
  startDate: string;
  members: string[];
}

export type ProgressMap = Record<number, string[]>;

export interface LeaderboardEntry {
  name: string;
  count: number;
}
