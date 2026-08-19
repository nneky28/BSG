import { ProgressMap } from './types';

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getTodayIndex(startDateStr: string, totalDays = 365): number {
  const start = new Date(startDateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return Math.min(totalDays, Math.max(1, diff));
}

/**
 * Encouraging streak calculation:
 * Counts consecutive read days up to today.
 */
export function computeStreak(name: string, progress: ProgressMap, currentDay: number): number {
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    const readers = progress[d] || [];
    if (readers.includes(name)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getCompletedCount(name: string, progress: ProgressMap): number {
  return Object.values(progress).filter((list) => (list || []).includes(name)).length;
}

/**
 * Get missed days (days before today that have not been read yet by this user).
 */
export function getMissedDays(name: string, progress: ProgressMap, expectedDay: number): number[] {
  const missed: number[] = [];
  for (let d = 1; d < expectedDay; d++) {
    const readers = progress[d] || [];
    if (!readers.includes(name)) {
      missed.push(d);
    }
  }
  return missed;
}
