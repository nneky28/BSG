import { BIBLE_BOOKS } from './bibleStructure';

export interface CustomDayEntry {
  day: number;
  week: number;
  reading: string;
  chapters: number;
  readUrl: string;
  prayerPoint: string;
}

export interface WeekMemoryVerse {
  week: number;
  reference: string;
  text: string;
}

// 27 Weekly Memory Verses curated across the whole scripture journey
export const WEEKLY_MEMORY_VERSES: Record<number, WeekMemoryVerse> = {
  1: { week: 1, reference: 'Genesis 1:1', text: 'In the beginning God created the heavens and the earth.' },
  2: { week: 2, reference: 'Genesis 28:15', text: 'I am with you and will watch over you wherever you go, and I will bring you back to this land.' },
  3: { week: 3, reference: 'Genesis 50:20', text: 'You intended to harm me, but God intended it for good to accomplish what is now being done.' },
  4: { week: 4, reference: 'Exodus 14:14', text: 'The LORD will fight for you; you need only to be still.' },
  5: { week: 5, reference: 'Leviticus 19:2', text: 'Speak to the entire assembly of Israel and say to them: Be holy because I, the LORD your God, am holy.' },
  6: { week: 6, reference: 'Numbers 6:24-26', text: 'The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you.' },
  7: { week: 7, reference: 'Deuteronomy 6:5', text: 'Love the LORD your God with all your heart and with all your soul and with all your strength.' },
  8: { week: 8, reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.' },
  9: { week: 9, reference: 'Ruth 1:16', text: 'Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.' },
  10: { week: 10, reference: '1 Samuel 16:7', text: 'The LORD does not look at the things people look at. People look at the outward appearance, but the LORD looks at the heart.' },
  11: { week: 11, reference: '2 Samuel 22:31', text: 'As for God, his way is perfect: The LORD’s word is flawless; he shields all who take refuge in him.' },
  12: { week: 12, reference: '1 Kings 8:56', text: 'Praise be to the LORD... Not one word has failed of all the good promises he gave.' },
  13: { week: 13, reference: '2 Chronicles 7:14', text: 'If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven.' },
  14: { week: 14, reference: 'Nehemiah 8:10', text: 'Do not grieve, for the joy of the LORD is your strength.' },
  15: { week: 15, reference: 'Job 19:25', text: 'I know that my redeemer lives, and that in the end he will stand on the earth.' },
  16: { week: 16, reference: 'Psalm 23:1', text: 'The LORD is my shepherd, I lack nothing.' },
  17: { week: 17, reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.' },
  18: { week: 18, reference: 'Proverbs 3:5-6', text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  19: { week: 19, reference: 'Isaiah 40:31', text: 'Those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary.' },
  20: { week: 20, reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  21: { week: 21, reference: 'Ezekiel 36:26', text: 'I will give you a new heart and put a new spirit in you; I will remove from you your heart of stone and give you a heart of flesh.' },
  22: { week: 22, reference: 'Micah 6:8', text: 'He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God.' },
  23: { week: 23, reference: 'Matthew 6:33', text: 'Seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
  24: { week: 24, reference: 'John 14:6', text: 'Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me.' },
  25: { week: 25, reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  26: { week: 26, reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.' },
  27: { week: 27, reference: 'Revelation 21:4', text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.' },
};

// Flatten all chapters from Genesis 1:1 to Revelation 22:21
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

function formatChapterRange(chapters: ChapterRef[]): string {
  if (chapters.length === 0) return '';
  if (chapters.length === 1) return `${chapters[0].book} ${chapters[0].chapter}`;

  const groups: { book: string; start: number; end: number }[] = [];
  let current: { book: string; start: number; end: number } | null = null;

  for (const ch of chapters) {
    if (!current || current.book !== ch.book) {
      if (current) groups.push(current);
      current = { book: ch.book, start: ch.chapter, end: ch.chapter };
    } else {
      current.end = ch.chapter;
    }
  }
  if (current) groups.push(current);

  return groups
    .map((g) => (g.start === g.end ? `${g.book} ${g.start}` : `${g.book} ${g.start}-${g.end}`))
    .join('; ');
}

export function buildBibleGatewayUrl(reading: string, version = 'NIV'): string {
  const query = encodeURIComponent(reading);
  return `https://www.biblegateway.com/passage/?search=${query}&version=${version}`;
}

const PRAYER_THEMES = [
  'Lord, open my eyes that I may see wondrous things from your law today.',
  'Father, teach me to trust in Your sovereignty and perfect timing in all seasons.',
  'Lord Jesus, shape my heart with humility, compassion, and steadfast obedience.',
  'Holy Spirit, grant me wisdom to discern truth and courage to live it out.',
  'Father, strengthen our fellowship in love, unity, and mutual encouragement.',
  'Lord, thank You for Your unfailing promises and ever-present grace.',
  'God of all grace, let Your Word dwell richly in my heart and transform my thoughts.'
];

/**
 * Generate exact 27-week progressive ramp:
 * Weeks 1-2 (Days 1-14): 3 ch/day
 * Weeks 3-4 (Days 15-28): 4 ch/day
 * Weeks 5-6 (Days 29-42): 5 ch/day
 * Weeks 7-10 (Days 43-70): 6 ch/day
 * Weeks 11-27 (Days 71-189): 7 ch/day (accommodating all 1189 chapters)
 */
export function generateCustomSchedule(): CustomDayEntry[] {
  const schedule: CustomDayEntry[] = [];
  const totalDays = 189; // 27 weeks * 7 days
  const totalCh = ALL_CHAPTERS.length; // 1189
  let currentIndex = 0;

  for (let day = 1; day <= totalDays; day++) {
    const week = Math.ceil(day / 7);
    let target = 7;

    if (week <= 2) target = 3;
    else if (week <= 4) target = 4;
    else if (week <= 6) target = 5;
    else if (week <= 10) target = 6;
    else target = 7;

    // Ensure we don't overshoot total chapters on the final days
    const remainingDays = totalDays - day + 1;
    const remainingChapters = totalCh - currentIndex;

    let chaptersForDay = Math.min(remainingChapters, target);
    // On the final days of week 27, distribute remaining evenly
    if (day >= 185 && remainingDays > 0) {
      chaptersForDay = Math.ceil(remainingChapters / remainingDays);
    }

    const daySlice = ALL_CHAPTERS.slice(currentIndex, currentIndex + chaptersForDay);
    currentIndex += chaptersForDay;

    const readingStr = formatChapterRange(daySlice);
    const readUrl = buildBibleGatewayUrl(readingStr);
    const prayerPoint = PRAYER_THEMES[(day - 1) % PRAYER_THEMES.length];

    schedule.push({
      day,
      week,
      reading: readingStr,
      chapters: daySlice.length,
      readUrl,
      prayerPoint,
    });
  }

  return schedule;
}

export const CUSTOM_SCHEDULE = generateCustomSchedule();
export const TOTAL_CUSTOM_DAYS = 189;
export const TOTAL_CUSTOM_WEEKS = 27;
