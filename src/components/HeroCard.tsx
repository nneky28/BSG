import React from 'react';
import { LedgerMeta, ProgressMap } from '../types';
import { formatDate, getCompletedCount, computeStreak } from '../utils';
import { isSupabaseConfigured } from '../services/supabase';

interface HeroCardProps {
  me: string;
  meta: LedgerMeta;
  progress: ProgressMap;
  expectedDay: number;
  onSwitchIdentity: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  me,
  meta,
  progress,
  expectedDay,
  onSwitchIdentity,
}) => {
  const myDone = getCompletedCount(me, progress);
  const pct = Math.round((myDone / 180) * 100);
  const streak = computeStreak(me, progress);
  const memberCount = meta.members.length;
  const isCloudSynced = isSupabaseConfigured();

  return (
    <div className="hero-card">
      <div className="hero-top">
        <p className="eyebrow">Six-month reading ledger</p>
        <span className={`sync-badge ${isCloudSynced ? 'online' : 'local'}`}>
          {isCloudSynced ? '● Cloud Synced' : '○ Local Mode'}
        </span>
      </div>

      <h1>Through the Book, Together</h1>
      <p className="sub">
        Started {formatDate(new Date(meta.startDate + 'T00:00:00'))} · 1,189 chapters · 180 days ·{' '}
        <span className="whoami" onClick={onSwitchIdentity} title="Click to switch reader identity">
          {me}
        </span>
      </p>

      <div className="ribbon-wrap">
        <div className="ribbon-label">
          <span>
            Day <b>{expectedDay}</b> of 180
          </span>
          <span>{pct}% complete</span>
        </div>
        <div className="ribbon-track">
          <div className="ribbon-fill" style={{ width: `${pct}%` }}>
            <div className="ribbon-tail" />
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <b>{myDone}</b>
          <span>Days read</span>
        </div>
        <div className="stat">
          <b>{pct}%</b>
          <span>Complete</span>
        </div>
        <div className="stat">
          <b>{streak}</b>
          <span>Streak</span>
        </div>
        <div className="stat">
          <b>{memberCount}</b>
          <span>Reader{memberCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
