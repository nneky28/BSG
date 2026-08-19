import { ProgressMap } from '../types';

export interface GraceBufferStatus {
  totalRead: number;
  totalAheadBanked: number;
  remainingBanked: number;
  missedDays: number[];
  coveredMissedDays: number[];
  uncoveredMissedDays: number[];
  isFullyCovered: boolean;
  effectiveStreak: number;
}

/**
 * Calculate member's carry-forward Grace Buffer status.
 * Any day read ahead (day > expectedDay) banks +1 Grace Day.
 * Any missed day (day < expectedDay and not read) automatically draws from the buffer first.
 */
export function calculateGraceBuffer(
  memberName: string,
  progress: ProgressMap,
  expectedDay: number
): GraceBufferStatus {
  const readDays = new Set<number>();
  Object.entries(progress).forEach(([dayStr, readers]) => {
    if ((readers || []).includes(memberName)) {
      readDays.add(Number(dayStr));
    }
  });

  // 1. Calculate how many days ahead have been read
  let aheadBanked = 0;
  readDays.forEach((day) => {
    if (day > expectedDay) {
      aheadBanked++;
    }
  });

  // 2. Find all missed days before today
  const missedDays: number[] = [];
  for (let d = 1; d < expectedDay; d++) {
    if (!readDays.has(d)) {
      missedDays.push(d);
    }
  }

  // 3. Auto-draw from Grace Buffer for missed days (oldest first)
  let availableBuffer = aheadBanked;
  const coveredMissedDays: number[] = [];
  const uncoveredMissedDays: number[] = [];

  missedDays.forEach((day) => {
    if (availableBuffer > 0) {
      coveredMissedDays.push(day);
      availableBuffer--;
    } else {
      uncoveredMissedDays.push(day);
    }
  });

  // 4. Calculate effective streak (consecutive days read or covered up to expectedDay)
  let effectiveStreak = 0;
  for (let d = expectedDay; d >= 1; d--) {
    if (readDays.has(d) || coveredMissedDays.includes(d)) {
      effectiveStreak++;
    } else {
      break;
    }
  }

  return {
    totalRead: readDays.size,
    totalAheadBanked: aheadBanked,
    remainingBanked: availableBuffer,
    missedDays,
    coveredMissedDays,
    uncoveredMissedDays,
    isFullyCovered: uncoveredMissedDays.length === 0,
    effectiveStreak,
  };
}
