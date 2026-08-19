import React, { useState } from 'react';
import { ScheduleDay, ProgressMap, ReflectionsMap, FilterView } from '../types';
import { getInitials } from '../utils';

interface WeekAccordionProps {
  schedule: ScheduleDay[];
  me: string;
  expectedDay: number;
  progress: ProgressMap;
  reflections: ReflectionsMap;
  activeFilter: FilterView;
  onToggleDay: (day: number) => void;
  onOpenReflection: (dayEntry: ScheduleDay) => void;
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
  activeFilter,
  onToggleDay,
  onOpenReflection,
}) => {
  const currentWeek = Math.ceil(expectedDay / 7);
  const totalWeeks = Math.ceil(schedule.length / 7);

  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({
    [currentWeek]: true,
  });

  const toggleWeek = (weekNum: number) => {
    setOpenWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const allWeeks = Array.from({ length: totalWeeks }, (_, w) => {
    const weekNum = w + 1;
    const startDay = w * 7 + 1;
    const endDay = Math.min(schedule.length, startDay + 6);
    const weekDays = schedule.slice(startDay - 1, endDay);
    const doneCount = weekDays.filter((d) => (progress[d.day] || []).includes(me)).length;
    const hasMissedDays = weekDays.some((d) => d.day < expectedDay && !(progress[d.day] || []).includes(me));
    const isFuture = startDay > expectedDay;
    const isOpen = activeFilter === 'catchup' ? hasMissedDays : !!openWeeks[weekNum];

    return {
      weekNum,
      startDay,
      endDay,
      weekDays,
      doneCount,
      hasMissedDays,
      isFuture,
      isOpen,
    };
  });

  // Filter weeks based on activeFilter
  const filteredWeeks = allWeeks.filter((w) => {
    if (activeFilter === 'catchup') return w.hasMissedDays;
    if (activeFilter === 'ahead') return w.isFuture || w.weekNum === currentWeek;
    return true;
  });

  return (
    <div id="weeks">
      <div className="weeks-header-row">
        <h2>Reading Schedule</h2>
        <span className="weeks-count-badge">
          {filteredWeeks.length} of {totalWeeks} Weeks
        </span>
      </div>

      {filteredWeeks.length === 0 && (
        <div className="empty-filter-state">
          {activeFilter === 'catchup' ? (
            <p>🎉 Wonderful! You have no missed days to catch up on.</p>
          ) : (
            <p>No reading entries matching this filter.</p>
          )}
        </div>
      )}

      {filteredWeeks.map((week) => (
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
              {week.hasMissedDays && (
                <span className="missed-chip">Catch-up available</span>
              )}
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
              const isMissed = d.day < expectedDay && !on;
              const dayReflections = reflections[d.day] || [];

              return (
                <div
                  key={d.day}
                  className={`day-row ${isToday ? 'is-today' : ''} ${isMissed ? 'is-missed' : ''}`}
                >
                  <div className="day-num">D{d.day}</div>
                  <div className="day-main-info">
                    <div className="day-ref">{d.reading}</div>
                    {isMissed && <span className="catchup-tag">Missed · Read at your pace</span>}
                  </div>

                  <button
                    type="button"
                    className={`day-reflect-btn ${dayReflections.length > 0 ? 'has-notes' : ''}`}
                    onClick={() => onOpenReflection(d)}
                    title="Read prompt & notes"
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
