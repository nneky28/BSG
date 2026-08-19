import React, { useState } from 'react';
import { CustomDayEntry, ProgressMap, ReflectionsMap } from '../types';
import { getInitials } from '../utils';
import { GraceBufferStatus } from '../services/bufferEngine';
import { WEEKLY_MEMORY_VERSES } from '../data/customSchedule';

interface WeekAccordionProps {
  schedule: CustomDayEntry[];
  me: string;
  expectedDay: number;
  progress: ProgressMap;
  reflections: ReflectionsMap;
  bufferStatus: GraceBufferStatus;
  onToggleDay: (day: number) => void;
  onOpenReflection: (dayEntry: CustomDayEntry) => void;
}

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none">
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WeekAccordion: React.FC<WeekAccordionProps> = ({
  schedule,
  me,
  expectedDay,
  progress,
  reflections,
  bufferStatus,
  onToggleDay,
  onOpenReflection,
}) => {
  const currentWeek = Math.ceil(expectedDay / 7);
  const totalWeeks = 27;

  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({
    [currentWeek]: true,
  });

  const toggleWeek = (weekNum: number) => {
    setOpenWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const weeks = Array.from({ length: totalWeeks }, (_, w) => {
    const weekNum = w + 1;
    const startDay = w * 7 + 1;
    const endDay = Math.min(schedule.length, startDay + 6);
    const weekDays = schedule.slice(startDay - 1, endDay);
    const doneCount = weekDays.filter((d) => (progress[d.day] || []).includes(me)).length;
    const isOpen = !!openWeeks[weekNum];

    let pace = '7 ch/day';
    if (weekNum <= 2) pace = '3 ch/day';
    else if (weekNum <= 4) pace = '4 ch/day';
    else if (weekNum <= 6) pace = '5 ch/day';
    else if (weekNum <= 10) pace = '6 ch/day';

    const memoryVerse = WEEKLY_MEMORY_VERSES[weekNum];

    return {
      weekNum,
      startDay,
      endDay,
      weekDays,
      doneCount,
      pace,
      memoryVerse,
      isOpen,
    };
  });

  return (
    <div id="weeks">
      <div className="weeks-header-row">
        <h2>Reading Schedule</h2>
        <span className="weeks-count-badge">27 Weeks (1,189 Chapters)</span>
      </div>

      {weeks.map((week) => (
        <div key={week.weekNum} className={`week ${week.isOpen ? 'open' : ''}`}>
          <div
            className="week-head"
            onClick={() => toggleWeek(week.weekNum)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleWeek(week.weekNum);
              }
            }}
          >
            <div className="week-left">
              <span className="week-title">Week {week.weekNum}</span>
              <span className="week-range">
                Days {week.startDay}–{week.endDay}
              </span>
              <span className="week-pace-chip">{week.pace}</span>
            </div>
            <div className="week-right">
              <span className="week-progress">
                {week.doneCount}/{week.weekDays.length}
              </span>
              <ChevronIcon className="chevron" />
            </div>
          </div>

          <div className={`week-body ${week.isOpen ? 'open' : ''}`}>
            {week.memoryVerse && (
              <div className="week-verse-snippet">
                <span className="verse-mini-label">📖 Week {week.weekNum} Verse:</span>
                <span className="verse-mini-text">"{week.memoryVerse.text}"</span>
                <b className="verse-mini-ref">({week.memoryVerse.reference})</b>
              </div>
            )}

            {week.weekDays.map((d) => {
              const readers = progress[d.day] || [];
              const on = readers.includes(me);
              const isCoveredByBuffer = !on && bufferStatus.coveredMissedDays.includes(d.day);
              const others = readers.filter((n) => n !== me);
              const isToday = d.day === expectedDay;
              const isMissed = d.day < expectedDay && !on && !isCoveredByBuffer;
              const dayReflections = reflections[d.day] || [];

              return (
                <div
                  key={d.day}
                  className={`day-row ${isToday ? 'is-today' : ''} ${isCoveredByBuffer ? 'is-buffer-covered' : ''}`}
                >
                  <div className="day-num">D{d.day}</div>
                  <div className="day-main-info">
                    <div className="day-ref-row">
                      <span className="day-ref">{d.reading}</span>
                      <a
                        href={d.readUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="day-read-arrow"
                        title="Read on BibleGateway"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ↗
                      </a>
                    </div>

                    {isCoveredByBuffer && (
                      <span className="buffer-tag">🛡️ Covered by Grace Buffer</span>
                    )}
                    {isMissed && (
                      <span className="missed-tag">Catch up anytime</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`day-reflect-btn ${dayReflections.length > 0 ? 'has-notes' : ''}`}
                    onClick={() => onOpenReflection(d)}
                    title="View / add reflection note"
                  >
                    💬 {dayReflections.length > 0 ? dayReflections.length : ''}
                  </button>

                  <div className="day-avatars">
                    {others.map((name) => (
                      <div key={name} className="av" title={name}>
                        {getInitials(name)}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`day-check ${on ? 'on' : ''} ${isCoveredByBuffer ? 'buffer-on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDay(d.day);
                    }}
                    aria-label={`Mark day ${d.day} as ${on ? 'unread' : 'read'}`}
                  >
                    {on ? '✓' : isCoveredByBuffer ? '🛡️' : ''}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
