import React, { useState } from 'react';
import { CustomDayEntry, ProgressMap, ReflectionNote } from '../types';
import { getInitials } from '../utils';

interface DailyCardProps {
  me: string;
  expectedDay: number;
  todayEntry: CustomDayEntry;
  progress: ProgressMap;
  reflections: ReflectionNote[];
  onToggleDay: (day: number) => void;
  onSaveReflection: (text: string, isPublic: boolean) => Promise<void>;
}

export const DailyCard: React.FC<DailyCardProps> = ({
  me,
  expectedDay,
  todayEntry,
  progress,
  reflections,
  onToggleDay,
  onSaveReflection,
}) => {
  const [reflectionText, setReflectionText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReflectionBox, setShowReflectionBox] = useState(false);

  const todayReaders = progress[expectedDay] || [];
  const iReadToday = todayReaders.includes(me);
  const othersToday = todayReaders.filter((n) => n !== me);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reflectionText.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await onSaveReflection(trimmed, isPublic);
      setReflectionText('');
      setShowReflectionBox(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card today-card">
      <div className="today-header">
        <h2>
          Today's Reading <span className="n">Day {expectedDay} · Week {todayEntry.week}</span>
        </h2>
        <a
          href={todayEntry.readUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-read-link"
          title="Open passage directly in BibleGateway"
        >
          📖 Read on BibleGateway ↗
        </a>
      </div>

      <div className="today-content-row">
        <div className="today-scripture-info">
          <div className="today-ref">{todayEntry.reading}</div>
          <div className="today-meta">{todayEntry.chapters} chapters target today</div>
        </div>

        <button
          className={`btn ${iReadToday ? 'done' : ''}`}
          onClick={() => onToggleDay(expectedDay)}
        >
          {iReadToday ? '✓ Read Today' : 'Mark as Read'}
        </button>
      </div>

      {/* Daily Prayer Focus */}
      <div className="prayer-focus-box">
        <span className="prayer-icon">🙏</span>
        <div className="prayer-content">
          <b className="prayer-title">Daily Prayer Focus</b>
          <p className="prayer-text">{todayEntry.prayerPoint}</p>
        </div>
      </div>

      {/* Other readers avatars */}
      {othersToday.length > 0 && (
        <div className="today-readers-row">
          <span className="readers-label">Read by fellowship:</span>
          <div className="avatars">
            {othersToday.map((name) => (
              <div key={name} className="av" title={name}>
                {getInitials(name)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reflection Journaling Section */}
      <div className="reflection-journal-wrap">
        {!showReflectionBox ? (
          <button
            className="btn-open-reflect"
            onClick={() => setShowReflectionBox(true)}
          >
            ✍️ What stood out to you today? {reflections.length > 0 && `(${reflections.length} reflections)`}
          </button>
        ) : (
          <form onSubmit={handleSave} className="daily-reflection-form">
            <label className="reflection-box-label">
              What is God speaking to you through today's chapters?
            </label>
            <textarea
              placeholder="Write your personal takeaway, key verse, or prayer..."
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              rows={3}
              required
            />
            <div className="reflection-controls">
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>{isPublic ? '👥 Share with fellowship' : '🔒 Keep private to me'}</span>
              </label>
              <div className="reflection-btn-group">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowReflectionBox(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-note"
                  disabled={isSaving || !reflectionText.trim()}
                >
                  {isSaving ? 'Saving…' : 'Save Reflection'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Existing reflections display */}
        {reflections.length > 0 && (
          <div className="today-reflections-list">
            {reflections.map((r, i) => (
              <div key={r.id || i} className={`mini-reflection-card ${r.author === me ? 'mine' : ''}`}>
                <div className="reflection-author-tag">
                  <b>{r.author}{r.author === me ? ' (you)' : ''}</b>
                  <span className="privacy-tag">{r.isPublic ? '👥 Fellowship' : '🔒 Private'}</span>
                </div>
                <p className="reflection-text">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
