import React from 'react';
import { ScheduleDay, ProgressMap, ReflectionNote } from '../types';
import { getInitials } from '../utils';

interface TodayCardProps {
  me: string;
  expectedDay: number;
  todayEntry: ScheduleDay;
  progress: ProgressMap;
  reflections: ReflectionNote[];
  onToggleDay: (day: number) => void;
  onOpenReflection: (dayEntry: ScheduleDay) => void;
}

export const TodayCard: React.FC<TodayCardProps> = ({
  me,
  expectedDay,
  todayEntry,
  progress,
  reflections,
  onToggleDay,
  onOpenReflection,
}) => {
  const todayReaders = progress[expectedDay] || [];
  const iReadToday = todayReaders.includes(me);
  const othersToday = todayReaders.filter((n) => n !== me);

  return (
    <div className="card">
      <h2>
        Today's reading <span className="n">Day {expectedDay}</span>
      </h2>

      <div className="today-row">
        <div className="today-main">
          <div className="today-ref">{todayEntry.reading}</div>
          <div className="today-meta">{todayEntry.chapters} chapters</div>

          {todayEntry.reflectionPrompt && (
            <p className="today-prompt">
              💭 <i>"{todayEntry.reflectionPrompt}"</i>
            </p>
          )}

          {othersToday.length > 0 && (
            <div className="avatars">
              {othersToday.map((name) => (
                <div key={name} className="av" title={name}>
                  {getInitials(name)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="today-actions">
          <button
            className="btn-outline-reflect"
            onClick={() => onOpenReflection(todayEntry)}
            title="Add or view spiritual takeaways"
          >
            ✍️ Reflect {reflections.length > 0 && `(${reflections.length})`}
          </button>
          <button
            className={`btn ${iReadToday ? 'done' : ''}`}
            onClick={() => onToggleDay(expectedDay)}
          >
            {iReadToday ? '✓ Read' : 'Mark as read'}
          </button>
        </div>
      </div>
    </div>
  );
};
