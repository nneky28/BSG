export interface ScheduleDay {
  day: number;
  reading: string;
  chapters: number;
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
