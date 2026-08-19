import React from 'react';
import { ScheduleDay, ProgressMap } from '../types';
import { getInitials } from '../utils';

interface TodayCardProps {
  me: string;
  expectedDay: number;
  todayEntry: ScheduleDay;
  progress: ProgressMap;
  onToggleDay: (day: number) => void;
}

export const TodayCard: React.FC<TodayCardProps> = ({
  me,
  expectedDay,
  todayEntry,
  progress,
  onToggleDay,
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
        <div>
          <div className="today-ref">{todayEntry.reading}</div>
          <div className="today-meta">{todayEntry.chapters} chapters</div>
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
        <button
          className={`btn ${iReadToday ? 'done' : ''}`}
          onClick={() => onToggleDay(expectedDay)}
        >
          {iReadToday ? '✓ Read' : 'Mark as read'}
        </button>
      </div>
    </div>
  );
};
