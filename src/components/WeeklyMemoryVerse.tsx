import React, { useState } from 'react';
import { WEEKLY_MEMORY_VERSES } from '../data/customSchedule';

interface WeeklyMemoryVerseProps {
  currentWeek: number;
}

export const WeeklyMemoryVerse: React.FC<WeeklyMemoryVerseProps> = ({ currentWeek }) => {
  const [copied, setCopied] = useState(false);
  const verseInfo = WEEKLY_MEMORY_VERSES[currentWeek] || WEEKLY_MEMORY_VERSES[1];

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${verseInfo.text}" — ${verseInfo.reference}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="memory-verse-card">
      <div className="verse-top">
        <span className="verse-label">✨ Week {verseInfo.week} Memory Verse</span>
        <button className="verse-copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy Verse'}
        </button>
      </div>
      <blockquote className="verse-text">
        "{verseInfo.text}"
      </blockquote>
      <div className="verse-ref">— {verseInfo.reference}</div>
    </div>
  );
};
