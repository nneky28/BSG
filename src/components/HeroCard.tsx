import React from 'react';
import { LedgerMeta } from '../types';
import { formatDate } from '../utils';
import { GraceBufferStatus } from '../services/bufferEngine';
import { isSupabaseConfigured } from '../services/supabase';

interface HeroCardProps {
  me: string;
  meta: LedgerMeta;
  expectedDay: number;
  currentWeek: number;
  bufferStatus: GraceBufferStatus;
  memberCount: number;
  onSwitchIdentity: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  me,
  meta,
  expectedDay,
  currentWeek,
  bufferStatus,
  memberCount,
  onSwitchIdentity,
}) => {
  const totalDays = 189;
  const pct = Math.round((bufferStatus.totalRead / totalDays) * 100);
  const isCloudSynced = isSupabaseConfigured();

  // Determine current pace label
  let paceLabel = '3 ch/day';
  if (currentWeek > 2 && currentWeek <= 4) paceLabel = '4 ch/day';
  else if (currentWeek > 4 && currentWeek <= 6) paceLabel = '5 ch/day';
  else if (currentWeek > 6 && currentWeek <= 10) paceLabel = '6 ch/day';
  else if (currentWeek > 10) paceLabel = '7 ch/day';

  return (
    <div className="hero-card">
      <div className="hero-top">
        <div className="pace-pill">
          <span>Week {currentWeek} of 27</span>
          <b className="pace-dot">·</b>
          <span>{paceLabel} pace</span>
        </div>
        <span className={`sync-badge ${isCloudSynced ? 'online' : 'local'}`}>
          {isCloudSynced ? '● Cloud Synced' : '○ Local Mode'}
        </span>
      </div>

      <h1>Through the Book, Together</h1>
      <p className="sub">
        Started {formatDate(new Date(meta.startDate + 'T00:00:00'))} · 1,189 chapters · 27 weeks ·{' '}
        <span className="whoami" onClick={onSwitchIdentity} title="Click to switch reader identity">
          {me}
        </span>
      </p>

      {/* Carry-Forward Grace Buffer Status Banner */}
      <div className="buffer-status-row">
        <div className={`buffer-chip ${bufferStatus.remainingBanked > 0 ? 'has-buffer' : 'empty'}`}>
          <span className="buffer-icon">🛡️</span>
          <div className="buffer-info">
            <b>Grace Buffer: {bufferStatus.remainingBanked} day{bufferStatus.remainingBanked !== 1 ? 's' : ''} banked</b>
            <span>
              {bufferStatus.remainingBanked > 0
                ? 'Reading ahead automatically covers any missed weekday!'
                : 'Read extra on weekends to bank grace days.'}
            </span>
          </div>
        </div>

        {bufferStatus.coveredMissedDays.length > 0 && (
          <div className="buffer-covered-notice">
            🌱 {bufferStatus.coveredMissedDays.length} missed day{bufferStatus.coveredMissedDays.length > 1 ? 's' : ''} auto-covered by your buffer!
          </div>
        )}
      </div>

      <div className="ribbon-wrap">
        <div className="ribbon-label">
          <span>
            Day <b>{expectedDay}</b> of {totalDays}
          </span>
          <span>{pct}% complete</span>
        </div>
        <div className="ribbon-track">
          <div className="ribbon-fill" style={{ width: `${Math.min(100, pct)}%` }}>
            <div className="ribbon-tail" />
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <b>{bufferStatus.totalRead}</b>
          <span>Days Read</span>
        </div>
        <div className="stat">
          <b>{pct}%</b>
          <span>Complete</span>
        </div>
        <div className="stat">
          <b>{bufferStatus.effectiveStreak}</b>
          <span>Streak (Days)</span>
        </div>
        <div className="stat">
          <b>{memberCount}</b>
          <span>Fellowship</span>
        </div>
      </div>
    </div>
  );
};
