import { BIBLE_BOOKS } from './bibleStructure';
import { ScheduleDay, ReadingPlan, PlanId } from '../types';
import { RAW_SCHEDULE } from './schedule';

// Helper to expand all 1,189 chapters as discrete units: { book, chapter }
interface ChapterRef {
  book: string;
  chapter: number;
}

const ALL_CHAPTERS: ChapterRef[] = [];
for (const book of BIBLE_BOOKS) {
  for (let c = 1; c <= book.chapters; c++) {
    ALL_CHAPTERS.push({ book: book.name, chapter: c });
  }
}

/**
 * Format a contiguous slice of chapters into a human-readable scripture reference.
 * e.g. "Genesis 1-3", "Genesis 48-50; Exodus 1-2", "Psalms 1-4"
 */
function formatChapterRange(chapters: ChapterRef[]): string {
  if (chapters.length === 0) return '';
  if (chapters.length === 1) return `${chapters[0].book} ${chapters[0].chapter}`;

  // Group chapters by book
  const groups: { book: string; start: number; end: number }[] = [];
  let currentGroup: { book: string; start: number; end: number } | null = null;

  for (const ch of chapters) {
    if (!currentGroup || currentGroup.book !== ch.book) {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { book: ch.book, start: ch.chapter, end: ch.chapter };
    } else {
      currentGroup.end = ch.chapter;
    }
  }
  if (currentGroup) groups.push(currentGroup);

  return groups
    .map((g) => (g.start === g.end ? `${g.book} ${g.start}` : `${g.book} ${g.start}-${g.end}`))
    .join('; ');
}

/**
 * Generate a 365-day schedule (~3.2 chapters per day).
 */
function generate365DayPlan(): ScheduleDay[] {
  const totalDays = 365;
  const totalCh = ALL_CHAPTERS.length; // 1189
  const schedule: ScheduleDay[] = [];

  let currentIndex = 0;
  for (let day = 1; day <= totalDays; day++) {
    // Determine how many chapters belong to this day
    const remainingDays = totalDays - day + 1;
    const remainingCh = totalCh - currentIndex;
    const count = Math.round(remainingCh / remainingDays);
    const dayChapters = ALL_CHAPTERS.slice(currentIndex, currentIndex + count);
    currentIndex += count;

    schedule.push({
      day,
      reading: formatChapterRange(dayChapters),
      chapters: dayChapters.length,
      reflectionPrompt: getSpiritualPrompt(day, dayChapters),
    });
  }

  return schedule;
}

/**
 * Generate a Progressive Ramp-Up Plan (240 days).
 * Starts at 2 chapters/day for first month, gradually increases to 3-4, then 5-6.
 */
function generateProgressivePlan(): ScheduleDay[] {
  const schedule: ScheduleDay[] = [];
  let currentIndex = 0;
  const totalCh = ALL_CHAPTERS.length;
  let day = 1;

  while (currentIndex < totalCh) {
    let chaptersToday = 2; // Default starting pace
    if (day > 30 && day <= 80) chaptersToday = 3;
    else if (day > 80 && day <= 140) chaptersToday = 4;
    else if (day > 140 && day <= 190) chaptersToday = 5;
    else if (day > 190) chaptersToday = 6;

    const remaining = totalCh - currentIndex;
    const count = Math.min(remaining, chaptersToday);
    const dayChapters = ALL_CHAPTERS.slice(currentIndex, currentIndex + count);
    currentIndex += count;

    schedule.push({
      day,
      reading: formatChapterRange(dayChapters),
      chapters: dayChapters.length,
      reflectionPrompt: getSpiritualPrompt(day, dayChapters),
    });
    day++;
  }

  return schedule;
}

/**
 * Generate 180-day schedule (~6.6 chapters per day).
 */
function generate180DayPlan(): ScheduleDay[] {
  return RAW_SCHEDULE.map(([day, reading, chapters]) => ({
    day,
    reading,
    chapters,
    reflectionPrompt: `What word or theme is God speaking to you through ${reading}?`,
  }));
}

function getSpiritualPrompt(day: number, chapters: ChapterRef[]): string {
  const sampleBook = chapters[0]?.book || 'Scripture';
  const prompts = [
    `What does today's passage in ${sampleBook} reveal about God's character and promises?`,
    `Which verse in ${sampleBook} resonates most with your heart today?`,
    `How can you apply the wisdom from today's reading to your daily walk?`,
    `What prayer or thanksgiving does today's passage inspire in you?`,
    `Reflect on how God's faithfulness is demonstrated in ${sampleBook}.`
  ];
  return prompts[day % prompts.length];
}

export const READING_PLANS: Record<PlanId, ReadingPlan> = {
  '365-day': {
    id: '365-day',
    title: '1-Year Deep & Steady',
    tagline: 'Ideal for deep reflection & consistent meditation (~3 chapters/day)',
    totalDays: 365,
    avgChaptersPerDay: '3–4',
    schedule: generate365DayPlan(),
  },
  'progressive': {
    id: 'progressive',
    title: 'Gentle Ramp-Up',
    tagline: 'Starts small with 2 ch/day, building steady spiritual momentum',
    totalDays: 240,
    avgChaptersPerDay: '2–5',
    schedule: generateProgressivePlan(),
  },
  '180-day': {
    id: '180-day',
    title: 'Six-Month Immersion',
    tagline: 'Accelerated intensive challenge (~6–7 chapters/day)',
    totalDays: 180,
    avgChaptersPerDay: '6–7',
    schedule: generate180DayPlan(),
  },
};

export const DEFAULT_PLAN_ID: PlanId = '365-day';
