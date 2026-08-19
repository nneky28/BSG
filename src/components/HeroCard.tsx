import React from 'react';
import { LedgerMeta, ProgressMap, ReadingPlan } from '../types';
import { formatDate, getCompletedCount, computeStreak } from '../utils';
import { isSupabaseConfigured } from '../services/supabase';

interface HeroCardProps {
  me: string;
  meta: LedgerMeta;
  plan: ReadingPlan;
  progress: ProgressMap;
  expectedDay: number;
  onSwitchIdentity: () => void;
  onOpenPlanSelector: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  me,
  meta,
  plan,
  progress,
  expectedDay,
  onSwitchIdentity,
  onOpenPlanSelector,
}) => {
  const myDone = getCompletedCount(me, progress);
  const pct = Math.round((myDone / plan.totalDays) * 100);
  const streak = computeStreak(me, progress, expectedDay);
  const memberCount = meta.members.length;
  const isCloudSynced = isSupabaseConfigured();

  return (
    <div className="hero-card">
      <div className="hero-top">
        <button
          className="plan-badge-btn"
          onClick={onOpenPlanSelector}
          title="Click to change reading plan or pacing"
        >
          📖 {plan.title} (~{plan.avgChaptersPerDay} ch/day) ▾
        </button>
        <span className={`sync-badge ${isCloudSynced ? 'online' : 'local'}`}>
          {isCloudSynced ? '● Cloud Synced' : '○ Local Mode'}
        </span>
      </div>

      <h1>Through the Book, Together</h1>
      <p className="sub">
        Started {formatDate(new Date(meta.startDate + 'T00:00:00'))} · 1,189 chapters · {plan.totalDays} days ·{' '}
        <span className="whoami" onClick={onSwitchIdentity} title="Click to switch reader identity">
          {me}
        </span>
      </p>

      <div className="ribbon-wrap">
        <div className="ribbon-label">
          <span>
            Day <b>{expectedDay}</b> of {plan.totalDays}
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
