import React, { useState } from 'react';
import { ScheduleDay, ProgressMap } from '../types';
import { getInitials } from '../utils';

interface WeekAccordionProps {
  schedule: ScheduleDay[];
  me: string;
  expectedDay: number;
  progress: ProgressMap;
  onToggleDay: (day: number) => void;
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
  onToggleDay,
}) => {
  const currentWeek = Math.ceil(expectedDay / 7);
  // Store open status of weeks in a map; default currentWeek to open
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({
    [currentWeek]: true,
  });

  const toggleWeek = (weekNum: number) => {
    setOpenWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const weeks = Array.from({ length: 26 }, (_, w) => {
    const weekNum = w + 1;
    const startDay = w * 7 + 1;
    const endDay = Math.min(180, startDay + 6);
    const weekDays = schedule.slice(startDay - 1, endDay);
    const doneCount = weekDays.filter((d) => (progress[d.day] || []).includes(me)).length;
    const isOpen = !!openWeeks[weekNum];

    return {
      weekNum,
      startDay,
      endDay,
      weekDays,
      doneCount,
      isOpen,
    };
  });

  return (
    <div id="weeks">
      {weeks.map((week) => (
        <div
          key={week.weekNum}
          className={`week ${week.isOpen ? 'open' : ''}`}
        >
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
            </div>
            <div className="week-right">
              <span className="week-progress">
                {week.doneCount}/{week.weekDays.length}
              </span>
              <ChevronIcon className="chevron" />
            </div>
          </div>

          <div className={`week-body ${week.isOpen ? 'open' : ''}`}>
            {week.weekDays.map((d) => {
              const readers = progress[d.day] || [];
              const on = readers.includes(me);
              const others = readers.filter((n) => n !== me);
              const isToday = d.day === expectedDay;

              return (
                <div
                  key={d.day}
                  className={`day-row ${isToday ? 'is-today' : ''}`}
                >
                  <div className="day-num">D{d.day}</div>
                  <div className="day-ref">{d.reading}</div>
                  <div className="day-avatars">
                    {others.map((name) => (
                      <div key={name} className="av" title={name}>
                        {getInitials(name)}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`day-check ${on ? 'on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDay(d.day);
                    }}
                    aria-label={`Mark day ${d.day} as ${on ? 'unread' : 'read'}`}
                  >
                    {on ? '✓' : ''}
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
